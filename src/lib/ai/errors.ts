/**
 * @fileoverview Custom Error hierarchy for the AI Coaching Engine.
 * Ensures technical/provider details are never leaked to client responses.
 */

export type AIErrorCode =
  | "AI_CONFIG_ERROR"
  | "AI_AUTH_ERROR"
  | "AI_RATE_LIMIT_ERROR"
  | "AI_TIMEOUT_ERROR"
  | "AI_SERVER_ERROR"
  | "AI_VALIDATION_ERROR"
  | "AI_UNKNOWN_ERROR";

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly statusCode: number;
  readonly isRetryable: boolean;
  readonly userFacingMessage: string;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    code: AIErrorCode;
    statusCode?: number;
    isRetryable?: boolean;
    userFacingMessage?: string;
    details?: unknown;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "AIError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.isRetryable = options.isRetryable ?? false;
    this.userFacingMessage =
      options.userFacingMessage ||
      "Our AI Coach encountered a temporary disruption. Please try your message again.";
    this.details = options.details;
  }
}

export class AIConfigurationError extends AIError {
  constructor(message = "NVIDIA NIM API key or configuration is missing or invalid.") {
    super({
      message,
      code: "AI_CONFIG_ERROR",
      statusCode: 500,
      isRetryable: false,
      userFacingMessage: "Coaching service is temporarily undergoing maintenance. Please check back shortly.",
    });
    this.name = "AIConfigurationError";
  }
}

export class AIAuthenticationError extends AIError {
  constructor(message = "Invalid NVIDIA NIM API credentials provided.") {
    super({
      message,
      code: "AI_AUTH_ERROR",
      statusCode: 401,
      isRetryable: false,
      userFacingMessage: "Unable to authenticate with the coaching service. Please contact support.",
    });
    this.name = "AIAuthenticationError";
  }
}

export class AIRateLimitError extends AIError {
  constructor(message = "NVIDIA NIM rate limit or quota exceeded.") {
    super({
      message,
      code: "AI_RATE_LIMIT_ERROR",
      statusCode: 429,
      isRetryable: true,
      userFacingMessage: "The coaching engine is experiencing high demand. Please pause a moment before trying again.",
    });
    this.name = "AIRateLimitError";
  }
}

export class AITimeoutError extends AIError {
  constructor(message = "NVIDIA NIM request timed out.") {
    super({
      message,
      code: "AI_TIMEOUT_ERROR",
      statusCode: 504,
      isRetryable: true,
      userFacingMessage: "The coaching session timed out while generating your response. Please try again.",
    });
    this.name = "AITimeoutError";
  }
}

export class AIServerError extends AIError {
  constructor(message = "NVIDIA NIM returned an upstream server error.", statusCode = 502) {
    super({
      message,
      code: "AI_SERVER_ERROR",
      statusCode,
      isRetryable: true,
      userFacingMessage: "The coaching engine encountered a temporary upstream issue. Please try again in a moment.",
    });
    this.name = "AIServerError";
  }
}

export class AIValidationError extends AIError {
  constructor(message = "Model output failed schema validation contract.", details?: unknown) {
    super({
      message,
      code: "AI_VALIDATION_ERROR",
      statusCode: 422,
      isRetryable: true,
      userFacingMessage: "We received an unexpected response format from the coach. Please re-send your message.",
      details,
    });
    this.name = "AIValidationError";
  }
}

/**
 * Maps raw provider errors (HTTP errors, timeouts, aborts) to standardized AIError instances.
 */
export function mapProviderError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }

  // Handle AbortController / Timeout
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return new AITimeoutError(`Request aborted due to timeout: ${error.message}`);
  }

  // Handle Fetch / Response status errors
  if (typeof error === "object" && error !== null) {
    const status = (error as { status?: number; statusCode?: number }).status ||
      (error as { status?: number; statusCode?: number }).statusCode;

    const message = (error as { message?: string }).message || "Unknown error";

    if (status === 401 || status === 403) {
      return new AIAuthenticationError(message);
    }
    if (status === 429) {
      return new AIRateLimitError(message);
    }
    if (status === 408 || status === 504) {
      return new AITimeoutError(message);
    }
    if (status && status >= 500) {
      return new AIServerError(message, status);
    }
  }

  const errMessage = error instanceof Error ? error.message : String(error);
  return new AIError({
    message: `Unexpected AI provider failure: ${errMessage}`,
    code: "AI_UNKNOWN_ERROR",
    statusCode: 500,
    isRetryable: false,
    userFacingMessage: "An unexpected error occurred while processing your coaching session.",
    cause: error,
  });
}
