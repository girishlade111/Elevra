/**
 * @fileoverview Safe Exponential Backoff Retry Utility.
 * Recovers from transient network blips and database cold starts for idempotent read operations.
 * @server-only
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 200,
  maxDelayMs: 2000,
  factor: 2,
  isRetryable: (error: unknown) => {
    if (!error) return false;
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("socket hang up") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("neon") ||
      msg.includes("connection closed")
    );
  },
};

/**
 * Executes an idempotent operation with exponential backoff and jitter.
 * ONLY use for read queries or idempotent API calls.
 */
export async function withSafeRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let delay = opts.initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (attempt === opts.maxRetries || !opts.isRetryable(err)) {
        throw err;
      }

      // Add jitter (+/- 20%) to avoid thundering herds
      const jitter = delay * (0.8 + Math.random() * 0.4);
      await new Promise((resolve) => setTimeout(resolve, jitter));
      delay = Math.min(delay * opts.factor, opts.maxDelayMs);
    }
  }

  throw lastError;
}
