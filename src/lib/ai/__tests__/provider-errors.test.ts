import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  mapProviderError,
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIServerError,
  AIConfigurationError,
} from "../errors";
import { NvidiaNIMProvider } from "../nvidia-nim";

describe("AI Provider Error Handling & Mapping", () => {
  it("maps HTTP 401 Unauthorized to AIAuthenticationError without leaking credentials", () => {
    const rawError = {
      status: 401,
      message: "Incorrect API key provided: nvapi-secret-12345",
    };

    const mapped = mapProviderError(rawError);
    assert.ok(mapped instanceof AIAuthenticationError);
    assert.equal(mapped.statusCode, 401);
    assert.equal(mapped.isRetryable, false);
    assert.equal(
      mapped.userFacingMessage,
      "Unable to authenticate with the coaching service. Please contact support."
    );
    assert.ok(!mapped.userFacingMessage.includes("nvapi-secret-12345"));
  });

  it("maps HTTP 429 Rate Limit to AIRateLimitError with retryable flag", () => {
    const rawError = {
      status: 429,
      message: "Rate limit reached for requests per minute on NIM endpoint",
    };

    const mapped = mapProviderError(rawError);
    assert.ok(mapped instanceof AIRateLimitError);
    assert.equal(mapped.statusCode, 429);
    assert.equal(mapped.isRetryable, true);
    assert.ok(mapped.userFacingMessage.includes("high demand"));
  });

  it("maps AbortError / Timeout to AITimeoutError with retryable flag", () => {
    const abortError = new Error("The operation was aborted due to timeout");
    abortError.name = "AbortError";

    const mapped = mapProviderError(abortError);
    assert.ok(mapped instanceof AITimeoutError);
    assert.equal(mapped.statusCode, 504);
    assert.equal(mapped.isRetryable, true);
    assert.ok(mapped.userFacingMessage.includes("timed out"));
  });

  it("maps HTTP 500/502/503 upstream errors to AIServerError with retryable flag", () => {
    const rawErrors = [
      { status: 500, message: "Internal server error" },
      { status: 502, message: "Bad Gateway" },
      { status: 503, message: "Service Unavailable" },
    ];

    for (const raw of rawErrors) {
      const mapped = mapProviderError(raw);
      assert.ok(mapped instanceof AIServerError);
      assert.equal(mapped.statusCode, raw.status);
      assert.equal(mapped.isRetryable, true);
    }
  });

  it("throws AIConfigurationError when NVIDIA API key is missing", async () => {
    const provider = new NvidiaNIMProvider({
      apiKey: "", // empty API key
    });

    await assert.rejects(
      async () => {
        await provider.generateCoaching({
          message: "How do I ask for a raise?",
          context: { userName: "Sarah" },
        });
      },
      (err: unknown) => {
        return err instanceof AIConfigurationError;
      }
    );
  });
});
