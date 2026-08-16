import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { getProfile } from "@/db/repositories/profile.repository";
import { listConversations } from "@/db/repositories/conversation.repository";
import { getMessages } from "@/db/repositories/message.repository";
import { listCheckins } from "@/db/repositories/weekly-checkin.repository";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { getUsageSummary } from "@/db/repositories/ai-usage.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;

    // Fetch all user records concurrently
    const [profile, convs, checkins, emailPref, usage] = await Promise.all([
      getProfile(userId),
      listConversations(userId, 100),
      listCheckins(userId, 100),
      getEmailPreference(userId),
      getUsageSummary(userId),
    ]);

    // Fetch messages for each conversation
    const conversationsWithMessages = await Promise.all(
      convs.map(async (conv) => {
        const messages = await getMessages(conv.id, userId);
        return {
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            intent: m.intent,
            createdAt: m.createdAt.toISOString(),
          })),
        };
      })
    );

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      account: {
        clerkUserId: userId,
        email: user?.email,
        name: profile?.name || user?.name,
      },
      profile: profile
        ? {
            name: profile.name,
            careerStage: profile.careerStage,
            challenge: profile.challenge,
            monthlyGoal: profile.monthlyGoal,
            onboardingCompleted: profile.onboardingCompleted,
            joinedAt: profile.joinedAt.toISOString(),
            lastActiveAt: profile.lastActiveAt.toISOString(),
          }
        : null,
      emailPreferences: emailPref
        ? {
            provider: emailPref.provider,
            weeklyCheckinsEnabled: emailPref.weeklyCheckinsEnabled,
            destinationEmail: emailPref.destinationEmail,
          }
        : null,
      usageSummary: usage,
      weeklyCheckins: checkins.map((chk) => ({
        id: chk.id,
        provider: chk.provider,
        subject: chk.subject,
        content: chk.content,
        status: chk.status,
        sentAt: chk.sentAt ? chk.sentAt.toISOString() : null,
        createdAt: chk.createdAt.toISOString(),
      })),
      conversations: conversationsWithMessages,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: exportBundle,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="elevra-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      }
    );
  } catch (error) {
    console.error("API POST /api/account/export error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "EXPORT_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate data export",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
