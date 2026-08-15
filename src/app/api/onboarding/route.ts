import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { markUserOnboarded } from "@/lib/auth/sync-user";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid onboarding payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const db = getDb();
    if (db) {
      try {
        const profileId = `prof_${userId}`;
        const existing = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(schema.profiles).values({
            id: profileId,
            userId,
            preferredName: parsed.data.preferredName || null,
            primaryGoal: parsed.data.primaryGoal,
            confidenceAreas: parsed.data.confidenceAreas,
            currentChallenge: parsed.data.currentChallenge || "General confidence calibration",
            baselineScore: parsed.data.baselineScore,
            coachingTone: parsed.data.coachingTone,
            emailUpdatesEnabled: parsed.data.emailUpdatesEnabled,
            preferredEmailTime: "09:00",
            timezone: "UTC",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          await db
            .update(schema.profiles)
            .set({
              preferredName: parsed.data.preferredName || existing[0]?.preferredName,
              primaryGoal: parsed.data.primaryGoal,
              confidenceAreas: parsed.data.confidenceAreas,
              currentChallenge: parsed.data.currentChallenge || existing[0]?.currentChallenge,
              baselineScore: parsed.data.baselineScore,
              coachingTone: parsed.data.coachingTone,
              emailUpdatesEnabled: parsed.data.emailUpdatesEnabled,
              updatedAt: new Date(),
            })
            .where(eq(schema.profiles.userId, userId));
        }
      } catch (dbErr) {
        console.warn("Could not persist onboarding to database:", dbErr);
      }
    }

    // Mark as onboarded in sync memory fallback
    await markUserOnboarded(userId);

    const profileRecord = {
      id: `prof_${userId}`,
      userId,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: profileRecord,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API /api/onboarding error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to save onboarding profile",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
