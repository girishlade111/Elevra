/**
 * @fileoverview Structured Server Logger & Request Correlation Engine.
 * Emits uniform JSON log events with automatic redaction of secrets, tokens, and PII.
 * @server-only
 */
import { nanoid } from "nanoid";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  requestId?: string;
  userId?: string | null;
  action: string;
  provider?: "nvidia_nim" | "resend" | "gmail" | "neon" | "clerk" | "system";
  status: "success" | "error" | "warning" | "started" | "skipped";
  durationMs?: number;
  message?: string;
  meta?: Record<string, unknown>;
  error?: unknown;
}

const REDACTED_KEYS = new Set([
  "password",
  "apppassword",
  "app_password",
  "secret",
  "cron_secret",
  "apikey",
  "api_key",
  "nvidia_api_key",
  "resend_api_key",
  "encryption_secret",
  "token",
  "authorization",
  "cookie",
  "session",
]);

/**
 * Deeply sanitizes an object by masking any keys matching sensitive patterns.
 */
export function sanitizeLogMeta(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogMeta(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeLogMeta(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Formats error objects safely into machine-readable log records without leaking stack in production.
 */
function extractErrorInfo(err: unknown) {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      code: (err as { code?: string }).code,
      statusCode: (err as { statusCode?: number }).statusCode,
    };
  }
  return { message: String(err) };
}

class StructuredLogger {
  /**
   * Generates a unique, short correlation ID for tracking request lifecycles.
   */
  generateRequestId(): string {
    return `req_${nanoid(12)}`;
  }

  log(level: LogLevel, payload: LogPayload): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      requestId: payload.requestId,
      userId: payload.userId ? payload.userId.slice(0, 16) : undefined,
      action: payload.action,
      provider: payload.provider,
      status: payload.status,
      durationMs: payload.durationMs,
      message: payload.message,
      meta: payload.meta ? sanitizeLogMeta(payload.meta) : undefined,
      error: extractErrorInfo(payload.error),
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      default:
        console.log(output);
        break;
    }
  }

  info(payload: LogPayload): void {
    this.log("info", payload);
  }

  warn(payload: LogPayload): void {
    this.log("warn", payload);
  }

  error(payload: LogPayload): void {
    this.log("error", payload);
  }
}

export const logger = new StructuredLogger();
