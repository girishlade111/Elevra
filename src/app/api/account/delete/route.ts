import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { clearAllConversations } from "@/db/repositories/conversation.repository";
import { deleteEmailConnection } from "@/db/repositories/email-connection.repository";
import { deleteProfile } from "@/db/repositories/profile.repository";
import { getDb } from "@/db";
import { weeklyCheckins, emailPreferences } from "@/db/schema/emails";
import { aiUsage } from "@/db/schema/coaching";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;
    const db = getDb();

    // 1. Delete all coaching dialogues and messages
    await clearAllConversations(userId);

    // 2. Delete Gmail credentials and email preferences
    await deleteEmailConnection(userId);

    await db
      .delete(emailPreferences)
      .where(eq(emailPreferences.clerkUserId, userId));

    // 3. Delete weekly check-in logs
    await db
      .delete(weeklyCheckins)
      .where(eq(weeklyCheckins.clerkUserId, userId));

    // 4. Delete AI token usage logs
    await db
      .delete(aiUsage)
      .where(eq(aiUsage.clerkUserId, userId));

    // 5. Delete profile record
    await deleteProfile(userId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          message:
            "All application database records have been permanently wiped. You may now sign out or delete your Clerk identity via the auth management portal.",
          wipedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/account/delete error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "ACCOUNT_DELETION_ERROR",
          message: error instanceof Error ? error.message : "Failed to wipe application database data",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
