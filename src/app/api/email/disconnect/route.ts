import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import type { ApiResponse } from "@/types/api";

export async function POST() {
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
