import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { sendMessageSchema } from "@/lib/validation/chat";
import { nvidiaNIMProvider } from "@/lib/ai/nvidia-nim";
import { getProfile, updateLastActive } from "@/db/repositories/profile.repository";
import { getRecentMessages, createMessage } from "@/db/repositories/message.repository";
import {
  getConversation,
  createConversation,
  touchConversation,
  updateConversationTitle,
} from "@/db/repositories/conversation.repository";
import { recordUsage } from "@/db/repositories/ai-usage.repository";
import { getMemory } from "@/db/repositories/memory.repository";
import { generateConversationTitle } from "@/lib/coaching/title-generator";
import { detectIntentLocal } from "@/lib/ai/intent";
import { AIError } from "@/lib/ai/errors";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Authenticate with Clerk & 2. Get Clerk userId server-side
    const authResult = await requireApiAuth(true);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId, user } = authResult;

    // 3. Load profile from Neon DB
    const profile = await getProfile(userId);

    // 4. Verify onboarding_completed = true
    if (!profile || !profile.onboardingCompleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "ONBOARDING_INCOMPLETE",
            message: "Please complete your onboarding profile before starting a coaching session.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 5. Validate incoming message with Zod
    const body = await req.json().catch(() => null);
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

    // 6. Detect intent early for context and title generation
    const localIntentResult = detectIntentLocal(message);
    const preDetectedIntent = localIntentResult.isConfident ? localIntentResult.intent : undefined;

    // 7. Load or create conversation (strictly scoped to userId, preventing unauthorized access)
    let activeConversationId = conversationId;
    let isNewConversation = false;

    if (activeConversationId) {
      const existingConv = await getConversation(activeConversationId, userId);
      if (!existingConv) {
        // ID provided but does not belong to this user or was deleted -> create a new one safely
        const generatedTitle = generateConversationTitle(message, preDetectedIntent);
        const createdConv = await createConversation(userId, generatedTitle);
        activeConversationId = createdConv.id;
        isNewConversation = true;
      }
    } else {
      const generatedTitle = generateConversationTitle(message, preDetectedIntent);
      const createdConv = await createConversation(userId, generatedTitle);
      activeConversationId = createdConv.id;
      isNewConversation = true;
    }

    // 8. Load last 5 meaningful exchanges (10 messages max)
    const dbMessages = await getRecentMessages(activeConversationId, userId, 10);
    // Reverse because getRecentMessages returns newest-first
    const recentMessages = dbMessages
      .reverse()
      .map((m) => {
        let textContent = m.content;
        if (m.role === "assistant") {
          try {
            const parsedJson = JSON.parse(m.content);
            textContent = parsedJson.main_advice || m.content;
          } catch {
            textContent = m.content;
          }
        }
        return {
          role: m.role as "user" | "assistant",
          content: textContent,
        };
      });

    // 9. Build personalized coaching context
    const memoryRecord = await getMemory(userId);
    const userName = profile.name || user?.firstName || user?.name || "Client";
    const careerStage = profile.careerStage || "Professional";
    const biggestChallenge = profile.challenge || "Navigating high-stakes career scenarios";
    const monthlyGoal = profile.monthlyGoal || "Strengthen unshakeable confidence and assertive impact";

    // 12a. Save user message first (stored before assistant response)
    await createMessage({
      conversationId: activeConversationId,
      clerkUserId: userId,
      role: "user",
      content: message,
    });

    // 10. Send request to NVIDIA NIM
    const coachingResult = await nvidiaNIMProvider.generateCoaching({
      message,
      context: {
        userName,
        careerStage,
        biggestChallenge,
        monthlyGoal,
        recentMessages,
        longTermMemory: memoryRecord
          ? { summaryText: memoryRecord.summary, updatedAt: memoryRecord.updatedAt }
          : undefined,
      },
    });

    // If conversation was pre-existing but had default title, update title based on first real turn
    if (!isNewConversation && dbMessages.length === 0) {
      const refinedTitle = generateConversationTitle(message, coachingResult.intent);
      await updateConversationTitle(activeConversationId, userId, refinedTitle);
    }

    // 13. Save assistant message with structured output contract
    await createMessage({
      conversationId: activeConversationId,
      clerkUserId: userId,
      role: "assistant",
      content: JSON.stringify(coachingResult.response),
      intent: coachingResult.intent,
    });

    // 14. Update conversation updated_at
    await touchConversation(activeConversationId, userId);

    // 15. Update last_active_at on profile
    await updateLastActive(userId);

    // 16. Record Token Consumption in ai_usage table (safe async)
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
      console.warn("[api/chat] Token recording non-fatal warning:", usageErr);
    }

    // 17. Return validated response to client
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
