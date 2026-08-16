import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { updateEmailPreferencesSchema } from "@/lib/validation/email";
import {
  getEmailPreference,
  upsertEmailPreference,
} from "@/db/repositories/email-preference.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;
    const pref = await getEmailPreference(userId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          provider: pref?.provider || "resend",
          weeklyCheckinsEnabled: pref?.weeklyCheckinsEnabled ?? true,
          destinationEmail: pref?.destinationEmail || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/email/preferences error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to load email preferences",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json().catch(() => null);
    const parsed = updateEmailPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid email preferences payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const updated = await upsertEmailPreference(userId, {
      provider: parsed.data.provider,
      weeklyCheckinsEnabled: parsed.data.weeklyCheckinsEnabled,
      destinationEmail: parsed.data.destinationEmail,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/email/preferences error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to update email preferences",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
