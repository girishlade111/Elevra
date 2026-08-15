import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser, type CurrentUserResult } from "./get-current-user";
import { ROUTES } from "@/config/routes";
import type { ApiResponse } from "@/types/api";

export interface RequireAuthOptions {
  /**
   * If true, redirects users whose onboarding is incomplete to /app/onboarding.
   * Default is false.
   */
  requireOnboarding?: boolean;
  /**
   * If true, redirects users whose onboarding is ALREADY complete to /app (used on onboarding page).
   * Default is false.
   */
  redirectIfOnboarded?: boolean;
}

/**
 * Server Component / Page guard.
 * Asserts that a user has a valid Clerk session.
 * - Redirects unauthenticated users to /sign-in
 * - Safely handles onboarding state redirects
 * - Returns authenticated user information
 */
export async function requireAuth(options: RequireAuthOptions = {}): Promise<CurrentUserResult> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.auth.signIn);
  }

  if (options.requireOnboarding && !user.isOnboarded) {
    redirect(ROUTES.app.onboarding);
  }

  if (options.redirectIfOnboarded && user.isOnboarded) {
    redirect(ROUTES.app.dashboard);
  }

  return user;
}

export type ApiAuthSuccess = {
  userId: string;
  user: CurrentUserResult | null;
  errorResponse: null;
};

export type ApiAuthFailure = {
  userId: null;
  user: null;
  errorResponse: NextResponse<ApiResponse>;
};

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

/**
 * Route Handler guard for /api/* endpoints.
 * Validates the Clerk session on the server.
 * Returns either verified userId or a 401 Unauthorized NextResponse.
 * 
 * NEVER trusts client-supplied user IDs from request body, query params, or URL.
 */
export async function requireApiAuth(fetchFullUser = false): Promise<ApiAuthResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        userId: null,
        user: null,
        errorResponse: NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required. Please sign in.",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        ),
      };
    }

    let user: CurrentUserResult | null = null;
    if (fetchFullUser) {
      user = await getCurrentUser();
    }

    return {
      userId,
      user,
      errorResponse: null,
    };
  } catch (error) {
    console.error("API Auth Verification Error:", error);
    return {
      userId: null,
      user: null,
      errorResponse: NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired session token.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }
}
