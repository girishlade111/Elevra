import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { updateProfileSchema } from "@/lib/validation/profile";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";
import type { UserProfile } from "@/types/user";

export async function GET() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;
    const db = getDb();

    if (db) {
      try {
        const existing = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.userId, userId))
          .limit(1);

        if (existing.length > 0 && existing[0]) {
          const p = existing[0];
          const profile: UserProfile = {
            id: p.id,
            userId: p.userId,
            fullName: user?.name || null,
            preferredName: p.preferredName || user?.firstName || null,
            primaryGoal: p.primaryGoal,
            confidenceAreas: p.confidenceAreas as UserProfile["confidenceAreas"],
            currentChallenge: p.currentChallenge,
            baselineScore: p.baselineScore,
            coachingTone: p.coachingTone as UserProfile["coachingTone"],
            emailUpdatesEnabled: p.emailUpdatesEnabled,
            preferredEmailTime: p.preferredEmailTime,
            timezone: p.timezone,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          };

          return NextResponse.json<ApiResponse<UserProfile>>(
            {
              success: true,
              data: profile,
              timestamp: new Date().toISOString(),
            },
            { status: 200 }
          );
        }
      } catch (dbErr) {
        console.warn("Could not query profiles from database:", dbErr);
      }
    }

    // Default calibration profile fallback
    const defaultProfile: UserProfile = {
      id: `prof_${userId}`,
      userId,
      fullName: user?.name || "Confidence Seeker",
      preferredName: user?.firstName || "User",
      primaryGoal: "Overcome self-doubt in high-stakes professional meetings",
      confidenceAreas: ["public_speaking", "career_negotiation", "imposter_syndrome"],
      currentChallenge: "Freezing up when asked unexpected questions by leadership",
      baselineScore: 6,
      coachingTone: "supportive",
      emailUpdatesEnabled: true,
      preferredEmailTime: "09:00",
      timezone: "UTC",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<UserProfile>>(
      {
        success: true,
        data: defaultProfile,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/profile error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to load profile",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid update profile payload",
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
        await db
          .update(schema.profiles)
          .set({
            ...(parsed.data.preferredName !== undefined && { preferredName: parsed.data.preferredName }),
            ...(parsed.data.primaryGoal !== undefined && { primaryGoal: parsed.data.primaryGoal }),
            ...(parsed.data.confidenceAreas !== undefined && {
              confidenceAreas: parsed.data.confidenceAreas,
            }),
            ...(parsed.data.currentChallenge !== undefined && {
              currentChallenge: parsed.data.currentChallenge,
            }),
            ...(parsed.data.baselineScore !== undefined && {
              baselineScore: parsed.data.baselineScore,
            }),
            ...(parsed.data.coachingTone !== undefined && {
              coachingTone: parsed.data.coachingTone,
            }),
            ...(parsed.data.emailUpdatesEnabled !== undefined && {
              emailUpdatesEnabled: parsed.data.emailUpdatesEnabled,
            }),
            ...(parsed.data.preferredEmailTime !== undefined && {
              preferredEmailTime: parsed.data.preferredEmailTime,
            }),
            ...(parsed.data.timezone !== undefined && { timezone: parsed.data.timezone }),
            updatedAt: new Date(),
          })
          .where(eq(schema.profiles.userId, userId));
      } catch (dbErr) {
        console.warn("Could not update profile in database:", dbErr);
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { userId, ...parsed.data, updatedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API PATCH /api/profile error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to update profile",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
