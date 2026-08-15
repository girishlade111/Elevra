import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { updateProfileSchema } from "@/lib/validation/profile";
import { getProfile, upsertProfile } from "@/db/repositories/profile.repository";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;

    try {
      const profile = await getProfile(userId);

      if (profile) {
        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              id: profile.id,
              clerkUserId: profile.clerkUserId,
              email: profile.email,
              name: profile.name,
              careerStage: profile.careerStage,
              challenge: profile.challenge,
              monthlyGoal: profile.monthlyGoal,
              onboardingStep: profile.onboardingStep,
              onboardingCompleted: profile.onboardingCompleted,
              joinedAt: profile.joinedAt.toISOString(),
              lastActiveAt: profile.lastActiveAt.toISOString(),
              createdAt: profile.createdAt.toISOString(),
              updatedAt: profile.updatedAt.toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    } catch (dbErr) {
      console.warn("Could not query profile from database:", dbErr);
    }

    // Default fallback profile shape
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: null,
          clerkUserId: userId,
          email: user?.email ?? "",
          name: user?.name ?? null,
          careerStage: null,
          challenge: null,
          monthlyGoal: null,
          onboardingStep: 0,
          onboardingCompleted: false,
        },
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

    const { userId, user } = authResult;

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

    try {
      const updateData: Parameters<typeof upsertProfile>[1] = {
        email: user?.email ?? "",
        name: parsed.data.name ?? parsed.data.fullName ?? parsed.data.preferredName ?? undefined,
        careerStage: parsed.data.careerStage ?? undefined,
        challenge: parsed.data.challenge ?? parsed.data.currentChallenge ?? undefined,
        monthlyGoal: parsed.data.monthlyGoal ?? parsed.data.primaryGoal ?? undefined,
      };

      const updated = await upsertProfile(userId, updateData);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            id: updated.id,
            clerkUserId: updated.clerkUserId,
            email: updated.email,
            name: updated.name,
            careerStage: updated.careerStage,
            challenge: updated.challenge,
            monthlyGoal: updated.monthlyGoal,
            updatedAt: updated.updatedAt.toISOString(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );

    } catch (dbErr) {
      console.warn("Could not update profile in database:", dbErr);
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { clerkUserId: userId, ...parsed.data, updatedAt: new Date().toISOString() },
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
