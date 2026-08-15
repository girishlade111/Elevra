import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { markUserOnboarded } from "@/lib/auth/sync-user";
import {
  step1NameSchema,
  step2CareerStageSchema,
  step3ChallengeSchema,
  step4MonthlyGoalSchema,
  saveStepPayloadSchema,
  completeOnboardingSchema,
} from "@/lib/validation/onboarding";
import {
  getProfile,
  upsertProfile,
  updateOnboarding,
} from "@/db/repositories/profile.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding
 * Returns current onboarding state and saved profile data for the authenticated Clerk user.
 */
export async function GET() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;
    const profile = await getProfile(userId);

    const data = {
      clerkUserId: userId,
      email: profile?.email || user?.email || "",
      name: profile?.name || user?.name || "",
      careerStage: profile?.careerStage || "",
      challenge: profile?.challenge || "",
      monthlyGoal: profile?.monthlyGoal || "",
      onboardingStep: profile?.onboardingStep ?? 0,
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      lastActiveAt: profile?.lastActiveAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/onboarding error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to load onboarding state",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Handles step-by-step saves (steps 1-4) or full submission.
 * Saves immediately to Neon PostgreSQL.
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;
    const rawBody = await req.json();

    // Ensure profile row exists first
    await upsertProfile(userId, {
      email: user?.email || "",
      name: user?.name || null,
    });

    // Check if this is a step-based save
    const stepParsed = saveStepPayloadSchema.safeParse(rawBody);

    if (stepParsed.success) {
      const { step, name, careerStage, challenge, monthlyGoal, isComplete } = stepParsed.data;

      // Validate according to step
      if (step === 1) {
        const validated = step1NameSchema.safeParse({ name });
        if (!validated.success) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: validated.error.errors[0]?.message || "Invalid name provided",
                details: validated.error.flatten(),
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const updated = await updateOnboarding(userId, {
          name: validated.data.name,
          onboardingStep: 1,
        });

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              step: 1,
              name: updated?.name,
              onboardingStep: updated?.onboardingStep ?? 1,
              onboardingCompleted: updated?.onboardingCompleted ?? false,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      if (step === 2) {
        const validated = step2CareerStageSchema.safeParse({ careerStage });
        if (!validated.success) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: validated.error.errors[0]?.message || "Invalid career stage",
                details: validated.error.flatten(),
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const updated = await updateOnboarding(userId, {
          careerStage: validated.data.careerStage,
          onboardingStep: 2,
        });

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              step: 2,
              careerStage: updated?.careerStage,
              onboardingStep: updated?.onboardingStep ?? 2,
              onboardingCompleted: updated?.onboardingCompleted ?? false,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      if (step === 3) {
        const validated = step3ChallengeSchema.safeParse({ challenge });
        if (!validated.success) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: validated.error.errors[0]?.message || "Invalid challenge",
                details: validated.error.flatten(),
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const updated = await updateOnboarding(userId, {
          challenge: validated.data.challenge,
          onboardingStep: 3,
        });

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              step: 3,
              challenge: updated?.challenge,
              onboardingStep: updated?.onboardingStep ?? 3,
              onboardingCompleted: updated?.onboardingCompleted ?? false,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      if (step === 4) {
        const validated = step4MonthlyGoalSchema.safeParse({ monthlyGoal });
        if (!validated.success) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: validated.error.errors[0]?.message || "Invalid monthly goal",
                details: validated.error.flatten(),
              },
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        const updated = await updateOnboarding(userId, {
          monthlyGoal: validated.data.monthlyGoal,
          onboardingStep: 4,
          onboardingCompleted: isComplete !== false,
        });

        if (isComplete !== false) {
          await markUserOnboarded(userId);
        }

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: {
              step: 4,
              monthlyGoal: updated?.monthlyGoal,
              onboardingStep: updated?.onboardingStep ?? 4,
              onboardingCompleted: updated?.onboardingCompleted ?? true,
            },
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    }

    // Check if full payload was passed directly
    const fullParsed = completeOnboardingSchema.safeParse(rawBody);
    if (fullParsed.success) {
      const { name, careerStage, challenge, monthlyGoal } = fullParsed.data;

      const updated = await updateOnboarding(userId, {
        name,
        careerStage,
        challenge,
        monthlyGoal,
        onboardingStep: 4,
        onboardingCompleted: true,
      });

      await markUserOnboarded(userId);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            name: updated?.name,
            careerStage: updated?.careerStage,
            challenge: updated?.challenge,
            monthlyGoal: updated?.monthlyGoal,
            onboardingStep: 4,
            onboardingCompleted: true,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid onboarding payload structure",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("API POST /api/onboarding error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to persist onboarding state",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
