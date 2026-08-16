import { NextResponse } from "next/server";
import { validateCronRequest } from "@/lib/security/cron-auth";
import { processWeeklyCheckinForUser } from "@/lib/coaching/checkin-engine";
import { clientEnv } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import type { ConfidenceArea, UserProfile } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const isAuthorized = validateCronRequest(authHeader);

    if (!isAuthorized) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "UNAUTHORIZED_CRON", message: "Invalid or missing cron bearer secret" },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Process checkin run
    const simulatedActiveUsers: Array<{
      user: { id: string; email: string };
      profile: UserProfile;
    }> = [
      {
        user: { id: "user_sample_1", email: "sample-user@example.com" },
        profile: {
          id: "p1",
          userId: "user_sample_1",
          fullName: "Alex Rivera",
          preferredName: "Alex",
          primaryGoal: "Lead engineering discussions with assertiveness",
          confidenceAreas: ["public_speaking", "leadership"] as ConfidenceArea[],
          currentChallenge: "Hesitating before interjecting in group architecture reviews",
          baselineScore: 6,
          coachingTone: "supportive",
          emailUpdatesEnabled: true,
          preferredEmailTime: "09:00",
          timezone: "UTC",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    const results = [];
    for (const item of simulatedActiveUsers) {
      if (item.profile.emailUpdatesEnabled) {
        const checkinResult = await processWeeklyCheckinForUser({
          user: item.user,
          profile: item.profile,
          recentMessages: [],
          appUrl: clientEnv.NEXT_PUBLIC_APP_URL,
        });
        results.push({ userId: item.user.id, ...checkinResult });
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          job: "weekly_checkin",
          processedCount: results.length,
          results,
        },
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
