/**
 * @fileoverview Unified Application Error Model.
 * Defines canonical error categories, status codes, and safe client representations.
 * @server-only
 */
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "DATABASE_ERROR"
  | "AI_PROVIDER_ERROR"
  | "EMAIL_PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface AppErrorOptions {
  message: string;
  code: AppErrorCode;
  statusCode?: number;
  userFacingMessage?: string;
  isRetryable?: boolean;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly userFacingMessage: string;
  readonly isRetryable: boolean;
  readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.isRetryable = options.isRetryable ?? false;
    this.userFacingMessage =
      options.userFacingMessage ||
      "An unexpected error occurred. Please try again or contact support if the issue persists.";
    this.details = options.details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request payload", details?: unknown) {
    super({
      message,
      code: "VALIDATION_ERROR",
      statusCode: 400,
      userFacingMessage: "Please check your input values and try again.",
      isRetryable: false,
      details,
    });
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required or session expired") {
    super({
      message,
      code: "AUTH_ERROR",
      statusCode: 401,
      userFacingMessage: "Your session has expired or authentication is required. Please sign in.",
      isRetryable: false,
    });
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied for this resource") {
    super({
      message,
      code: "FORBIDDEN",
      statusCode: 403,
      userFacingMessage: "You do not have permission to access or modify this resource.",
      isRetryable: false,
    });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Requested resource", id?: string) {
    const msg = id ? `${resource} with ID '${id}' was not found.` : `${resource} was not found.`;
    super({
      message: msg,
      code: "NOT_FOUND",
      statusCode: 404,
      userFacingMessage: "The requested item could not be found.",
      isRetryable: false,
    });
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", cause?: unknown) {
    super({
      message,
      code: "DATABASE_ERROR",
      statusCode: 500,
      userFacingMessage: "A temporary data storage disruption occurred. Please try again.",
      isRetryable: true,
      cause,
    });
    this.name = "DatabaseError";
  }
}

export class AiProviderError extends AppError {
  constructor(message = "AI model generation failed", statusCode = 502, isRetryable = true) {
    super({
      message,
      code: "AI_PROVIDER_ERROR",
      statusCode,
      userFacingMessage: "The coaching engine encountered a temporary delay. Please try your message again.",
      isRetryable,
    });
    this.name = "AiProviderError";
  }
}

export class EmailProviderError extends AppError {
  constructor(message = "Email dispatch failed", statusCode = 400) {
    super({
      message,
      code: "EMAIL_PROVIDER_ERROR",
      statusCode,
      userFacingMessage: "Unable to dispatch email. Please verify your email connection settings.",
      isRetryable: false,
    });
    this.name = "EmailProviderError";
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Rate limit exceeded", resetMs?: number) {
    super({
      message,
      code: "RATE_LIMITED",
      statusCode: 429,
      userFacingMessage: "Too many requests. Please pause a moment before trying again.",
      isRetryable: true,
      details: resetMs ? { resetMs } : undefined,
    });
    this.name = "RateLimitedError";
  }
}

export class InternalError extends AppError {
  constructor(message = "Internal server error", cause?: unknown) {
    super({
      message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
      userFacingMessage: "A temporary server disruption occurred. Please try again.",
      isRetryable: true,
      cause,
    });
    this.name = "InternalError";
  }
}

/**
 * Transforms any caught error into a safe, consistent NextResponse<ApiResponse>.
 * Guaranteed NEVER to leak stack traces, SQL errors, or credentials to clients.
 */
export function formatErrorResponse(error: unknown, requestId?: string): NextResponse<ApiResponse> {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.userFacingMessage,
          details: error.details,
          requestId,
        },
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard errors safely
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again shortly.",
        requestId,
      },
      timestamp,
    },
    { status: 500 }
  );
}
