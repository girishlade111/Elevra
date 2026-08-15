import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { markUserOnboarded } from "@/lib/auth/sync-user";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { upsertProfile, updateOnboarding } from "@/db/repositories/profile.repository";
import type { ApiResponse } from "@/types/api";
import type { CareerStage } from "@/db/schema/users";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;

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

    // Upsert profile with the new schema fields
    const profile = await upsertProfile(userId, {
      email: user?.email ?? "",
      name: parsed.data.fullName ?? parsed.data.preferredName ?? null,
      // Map onboarding input to new schema — challenge maps from currentChallenge
      challenge: parsed.data.currentChallenge ?? null,
      // monthlyGoal maps from primaryGoal
      monthlyGoal: parsed.data.primaryGoal ?? null,
    });

    // Mark onboarding as complete
    await updateOnboarding(userId, {
      onboardingCompleted: true,
      onboardingStep: 99,
    });

    // Also update memory store fallback
    await markUserOnboarded(userId);

    const profileRecord = {
      id: profile.id,
      clerkUserId: userId,
      name: profile.name,
      challenge: profile.challenge,
      monthlyGoal: profile.monthlyGoal,
      onboardingCompleted: true,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
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

// Suppress unused import warning
type _CareerStage = CareerStage;
