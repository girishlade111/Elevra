import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/profile";
import type { ApiResponse } from "@/types/api";
import type { UserProfile } from "@/types/user";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User session required" },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const defaultProfile: UserProfile = {
      id: `prof_${session.userId}`,
      userId: session.userId,
      fullName: session.name || "Confidence Seeker",
      preferredName: session.name?.split(" ")[0] || "User",
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
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User session required" },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

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

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { userId: session.userId, ...parsed.data, updatedAt: new Date().toISOString() },
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
