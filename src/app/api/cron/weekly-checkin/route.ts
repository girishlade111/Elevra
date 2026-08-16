import { NextResponse } from "next/server";
import { validateCronRequest } from "@/lib/security/cron-auth";
import { runWeeklyCheckinCron } from "@/lib/coaching/checkin-engine";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { getServerEnv, clientEnv } from "@/config/env";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

/**
 * Scheduled Cron Endpoint for weekly personalized coaching digests.
 * Triggered automatically by Vercel Cron on Mondays at 09:00 UTC.
 *
 * Security:
 * - Requires Authorization: Bearer <CRON_SECRET> header.
 * - In development, allows manual execution or single-user test runs.
 * - Authenticated users can test-trigger their own checkin via POST /api/cron/weekly-checkin.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId") || searchParams.get("user_id");

    const isCronAuthorized = validateCronRequest(authHeader);

    // If not authorized via CRON_SECRET, check if an authenticated user is triggering in dev
    if (!isCronAuthorized) {
      const env = getServerEnv();
      if (env.NODE_ENV === "development" && requestedUserId) {
        // Allow dev inspection
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED_CRON",
              message: "Invalid or missing cron authorization secret.",
            },
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        );
      }
    }

    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;
    const summary = await runWeeklyCheckinCron({
      forceUserId: requestedUserId || undefined,
      appUrl,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/cron/weekly-checkin error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "CRON_EXECUTION_ERROR",
          message: error instanceof Error ? error.message : "Failed to execute weekly checkin cron",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for authenticated users in development or test suites.
 * Allows the current logged-in user to test their personalized check-in synthesis.
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;
    const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;

    const summary = await runWeeklyCheckinCron({
      forceUserId: userId,
      appUrl,
    });

    const userResult = summary.results.find((r) => r.userId === userId);

    return NextResponse.json<ApiResponse>(
      {
        success: userResult?.status === "sent",
        data: {
          summary,
          result: userResult,
        },
        timestamp: new Date().toISOString(),
      },
      { status: userResult?.status === "sent" ? 200 : 400 }
    );
  } catch (error) {
    console.error("API POST /api/cron/weekly-checkin error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "MANUAL_CHECKIN_ERROR",
          message: error instanceof Error ? error.message : "Failed to execute manual checkin trigger",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
