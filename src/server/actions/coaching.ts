"use server";

import { requireAuthSession } from "@/lib/auth/session";
import { aiClient } from "@/lib/ai/client";
import { buildCoachingContextWindow } from "@/lib/coaching/memory";
import { sendMessageSchema } from "@/lib/validation/chat";
import type { ApiResponse } from "@/types/api";

export async function sendCoachingMessageAction(rawInput: unknown): Promise<ApiResponse> {
  try {
    const session = await requireAuthSession();
    const parsed = sendMessageSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid chat payload",
          details: parsed.error.flatten(),
        },
        timestamp: new Date().toISOString(),
      };
    }

    const messages = buildCoachingContextWindow({
      profile: {
        preferredName: session.name,
        primaryGoal: "Build unshakeable communication confidence",
      },
      history: [
        {
          id: "m_server_act",
          conversationId: parsed.data.conversationId || "conv_server_action",
          sender: "user",
          content: parsed.data.message,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const result = await aiClient.generateCoachingResponse({
      messages,
      responseFormatJson: true,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "SERVER_ACTION_ERROR",
        message: error instanceof Error ? error.message : "Failed to execute coaching action",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
