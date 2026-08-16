/**
 * @fileoverview In-memory sliding window rate limiter for API endpoints.
 * Prevents abuse of AI generation, email dispatching, and credential testing.
 * @server-only
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed within window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitRecord {
  timestamps: number[];
}

class RateLimiter {
  private storage: Map<string, RateLimitRecord> = new Map();
  private lastCleanup: number = Date.now();
  private cleanupIntervalMs: number = 60 * 1000; // 1 minute cleanup cycle

  /**
   * Evaluates if a key (e.g. `chat:${userId}`) has exceeded the configured rate limit.
   */
  check(key: string, config: RateLimitConfig): { success: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    this.maybeCleanup(now);

    const record = this.storage.get(key) || { timestamps: [] };

    // Filter out timestamps outside the active window
    const windowStart = now - config.windowMs;
    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= config.maxRequests) {
      const oldestValid = validTimestamps[0] || now;
      const resetMs = Math.max(0, oldestValid + config.windowMs - now);

      return {
        success: false,
        remaining: 0,
        resetMs,
      };
    }

    // Add current request timestamp
    validTimestamps.push(now);
    this.storage.set(key, { timestamps: validTimestamps });

    return {
      success: true,
      remaining: config.maxRequests - validTimestamps.length,
      resetMs: config.windowMs,
    };
  }

  /**
   * Resets rate limit records for a given key (e.g. after successful auth).
   */
  reset(key: string): void {
    this.storage.delete(key);
  }

  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;

    this.lastCleanup = now;
    const maxRetentionMs = 60 * 60 * 1000; // 1 hour max window
    for (const [key, record] of this.storage.entries()) {
      const valid = record.timestamps.filter((ts) => ts > now - maxRetentionMs);
      if (valid.length === 0) {
        this.storage.delete(key);
      } else {
        this.storage.set(key, { timestamps: valid });
      }
    }
  }
}

// Global singleton rate limiter instance
export const rateLimiter = new RateLimiter();

// Preconfigured rate limit tiers
export const RATE_LIMIT_TIERS = {
  CHAT: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  EMAIL_TEST: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 5 test emails per 10 minutes
  },
  EMAIL_CONNECT: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 connect attempts per 5 minutes
  },
  ACCOUNT_EXPORT: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 data exports per hour
  },
} as const;
