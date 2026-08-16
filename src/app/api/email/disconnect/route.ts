import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { deleteEmailConnection } from "@/db/repositories/email-connection.repository";
import { upsertEmailPreference } from "@/db/repositories/email-preference.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    // 1. Delete encrypted credentials from database
    await deleteEmailConnection(userId);

    // 2. Reset provider preference to default Resend (with weekly check-ins paused)
    await upsertEmailPreference(userId, {
      provider: "resend",
      weeklyCheckinsEnabled: false,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          message: "Gmail SMTP disconnected and credentials deleted safely. Weekly check-in history preserved.",
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/email/disconnect error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to disconnect email provider",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
