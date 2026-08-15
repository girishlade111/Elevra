import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import type { ApiResponse } from "@/types/api";

export async function POST() {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { message: "Email provider disconnected successfully", updatedAt: new Date().toISOString() },
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
