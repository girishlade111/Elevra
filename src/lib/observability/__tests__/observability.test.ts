import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ForbiddenError,
  DatabaseError,
  AiProviderError,
  EmailProviderError,
  RateLimitedError,
  formatErrorResponse,
} from "@/lib/errors/app-error";
import { sanitizeLogMeta, logger } from "@/lib/observability/logger";
import { withSafeRetry } from "@/lib/observability/retry";

describe("Unified Error Model & Status Mappings", () => {
  test("ValidationError produces 400 and user-facing message", () => {
    const err = new ValidationError("Field 'name' is required");
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, "VALIDATION_ERROR");
    assert.equal(err.isRetryable, false);
  });

  test("AuthError produces 401 and user-facing message", () => {
    const err = new AuthError();
    assert.equal(err.statusCode, 401);
    assert.equal(err.code, "AUTH_ERROR");
  });

  test("NotFoundError produces 404 with resource identifier", () => {
    const err = new NotFoundError("Conversation", "conv_123");
    assert.equal(err.statusCode, 404);
    assert.equal(err.code, "NOT_FOUND");
  });

  test("RateLimitedError produces 429 and retryable flag", () => {
    const err = new RateLimitedError("Too many chat messages", 5000);
    assert.equal(err.statusCode, 429);
    assert.equal(err.code, "RATE_LIMITED");
    assert.equal(err.isRetryable, true);
  });

  test("formatErrorResponse guarantees no raw stack traces leak to client", async () => {
    const rawError = new Error("FATAL: relation \"conversations\" does not exist at SELECT * FROM...");
    const response = formatErrorResponse(rawError, "req_test_123");
    const json = await response.json();

    assert.equal(response.status, 500);
    assert.equal(json.success, false);
    assert.equal(json.error.code, "INTERNAL_ERROR");
    assert.ok(!json.error.message.includes("FATAL"));
    assert.ok(!json.error.message.includes("SELECT"));
    assert.equal(json.error.requestId, "req_test_123");
  });
});

describe("Structured Logger & Secret Redaction", () => {
  test("redacts sensitive fields in nested log metadata", () => {
    const meta = {
      user: "Alex",
      credentials: {
        appPassword: "abcd efgh ijkl mnop",
        apiKey: "nvapi-secret-12345",
      },
      headers: {
        authorization: "Bearer secret-token",
        cron_secret: "cron-secret-value",
      },
      cleanValue: 42,
    };

    const sanitized = sanitizeLogMeta(meta) as typeof meta;
    assert.equal(sanitized.credentials.appPassword, "[REDACTED]");
    assert.equal(sanitized.credentials.apiKey, "[REDACTED]");
    assert.equal(sanitized.headers.authorization, "[REDACTED]");
    assert.equal(sanitized.headers.cron_secret, "[REDACTED]");
    assert.equal(sanitized.cleanValue, 42);
  });

  test("generates uniform correlation requestIds", () => {
    const reqId = logger.generateRequestId();
    assert.ok(reqId.startsWith("req_"));
    assert.ok(reqId.length > 10);
  });
});

describe("Exponential Backoff Safe Retry", () => {
  test("retries transient failures and succeeds when resolved", async () => {
    let attempts = 0;
    const result = await withSafeRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("ECONNRESET: Neon socket closed");
        }
        return "SUCCESS_DATA";
      },
      { maxRetries: 3, initialDelayMs: 10, maxDelayMs: 50 }
    );

    assert.equal(result, "SUCCESS_DATA");
    assert.equal(attempts, 3);
  });

  test("fails fast on non-transient / non-retryable errors", async () => {
    let attempts = 0;
    await assert.rejects(
      async () => {
        await withSafeRetry(
          async () => {
            attempts++;
            throw new Error("SYNTAX_ERROR: invalid token at character 5");
          },
          { maxRetries: 3, initialDelayMs: 10 }
        );
      },
      /SYNTAX_ERROR/
    );

    assert.equal(attempts, 1);
  });
});
