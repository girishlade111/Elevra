import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { createConversationSchema } from "@/lib/validation/chat";
import type { ApiResponse } from "@/types/api";
import type { Conversation } from "@/types/coaching";

export async function GET() {
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

    const sampleConversations: Conversation[] = [
      {
        id: "c_demo_1",
        userId: session.userId,
        title: "Preparing for Quarterly Review Presentation",
        summary: "Worked through breathing exercises and slide pacing strategies.",
        lastIntent: "roleplay_practice",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "c_demo_2",
        userId: session.userId,
        title: "Imposter Syndrome in Senior Engineering Sync",
        summary: "Reframed feelings of inadequacy into growth curiosity signals.",
        lastIntent: "mindset_reframing",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];

    return NextResponse.json<ApiResponse<Conversation[]>>(
      {
        success: true,
        data: sampleConversations,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/conversations error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to load conversations",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

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

    const body = await req.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);

    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      userId: session.userId,
      title: parsed.success && parsed.data.title ? parsed.data.title : "New Coaching Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<Conversation>>(
      {
        success: true,
        data: newConversation,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API POST /api/conversations error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to create conversation",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
