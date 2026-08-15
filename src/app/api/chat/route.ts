import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { sendMessageSchema } from "@/lib/validation/chat";
import { aiClient } from "@/lib/ai/client";
import { buildCoachingContextWindow } from "@/lib/coaching/memory";
import type { ApiResponse } from "@/types/api";

export async function POST(req: Request) {
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

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid chat payload",
            details: parsed.error.flatten(),
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    // Build context window with user profile context
    const messages = buildCoachingContextWindow({
      profile: {
        preferredName: session.name,
        primaryGoal: "Build unshakeable communication confidence",
      },
      history: [
        {
          id: "m_init",
          conversationId: parsed.data.conversationId,
          sender: "user",
          content: message,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const result = await aiClient.generateCoachingResponse({
      messages,
      responseFormatJson: true,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to process chat completion",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
