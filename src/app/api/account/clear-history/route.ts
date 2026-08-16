import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { clearAllConversations } from "@/db/repositories/conversation.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    await clearAllConversations(userId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          message: "All coaching conversation history and message logs cleared successfully.",
          clearedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/account/clear-history error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "CLEAR_HISTORY_ERROR",
          message: error instanceof Error ? error.message : "Failed to clear conversation history",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
