import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { sendMessageSchema } from "@/lib/validation/chat";
import { nvidiaNIMProvider } from "@/lib/ai/nvidia-nim";
import { getProfile } from "@/db/repositories/profile.repository";
import { getRecentMessages, createMessage } from "@/db/repositories/message.repository";
import { getConversation, createConversation, touchConversation } from "@/db/repositories/conversation.repository";
import { recordUsage } from "@/db/repositories/ai-usage.repository";
import { AIError } from "@/lib/ai/errors";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid chat message payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { message, conversationId } = parsed.data;

    // 1. Ensure conversation exists
    let activeConversationId = conversationId;
    if (activeConversationId) {
      const existingConv = await getConversation(activeConversationId, userId);
      if (!existingConv) {
        const createdConv = await createConversation(userId, message.slice(0, 40));
        activeConversationId = createdConv.id;
      }
    } else {
      const createdConv = await createConversation(userId, message.slice(0, 40));
      activeConversationId = createdConv.id;
    }

    // 2. Fetch User Profile for Personalization
    const profile = await getProfile(userId);
    const userName = profile?.name || user?.firstName || user?.name || "Client";
    const careerStage = profile?.careerStage || "Professional";
    const biggestChallenge = profile?.challenge || "Navigating high-stakes career scenarios";
    const monthlyGoal = profile?.monthlyGoal || "Strengthen unshakeable confidence and assertive impact";

    // 3. Fetch Recent Messages (last 5 exchanges = 10 messages max)
    const dbMessages = await getRecentMessages(activeConversationId, userId, 10);
    // Reverse because getRecentMessages returns newest first
    const recentMessages = dbMessages
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // 4. Generate Structured Coaching Completion via NVIDIA NIM
    const coachingResult = await nvidiaNIMProvider.generateCoaching({
      message,
      context: {
        userName,
        careerStage,
        biggestChallenge,
        monthlyGoal,
        recentMessages,
      },
    });

    // 5. Persist User Message and Assistant Message to DB
    await createMessage({
      conversationId: activeConversationId,
      clerkUserId: userId,
      role: "user",
      content: message,
    });

    await createMessage({
      conversationId: activeConversationId,
      clerkUserId: userId,
      role: "assistant",
      content: JSON.stringify(coachingResult.response),
      intent: coachingResult.intent,
    });

    await touchConversation(activeConversationId, userId);

    // 6. Record Token Consumption in ai_usage table (only on successful completion)
    try {
      if (coachingResult.usage.inputTokens !== null && coachingResult.usage.outputTokens !== null) {
        await recordUsage({
          clerkUserId: userId,
          endpointType: "coaching",
          model: coachingResult.usage.model,
          inputTokens: coachingResult.usage.inputTokens,
          outputTokens: coachingResult.usage.outputTokens,
        });
      }
    } catch (usageErr) {
      console.warn("[api/chat] Failed to log AI token usage:", usageErr);
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          conversationId: activeConversationId,
          response: coachingResult.response,
          intent: coachingResult.intent,
          usage: coachingResult.usage,
          latencyMs: coachingResult.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API POST /api/chat error:", error);

    if (error instanceof AIError) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: error.code,
            message: error.userFacingMessage,
          },
          timestamp: new Date().toISOString(),
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "A temporary error occurred while processing your coaching session. Please try again.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
