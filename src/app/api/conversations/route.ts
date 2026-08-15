import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import { createConversationSchema } from "@/lib/validation/chat";
import {
  createConversation,
  listConversations,
} from "@/db/repositories/conversation.repository";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const conversations = await listConversations(userId, 50);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: conversations.map((c) => ({
          id: c.id,
          clerkUserId: c.clerkUserId,
          title: c.title,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
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
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;

    const body = await req.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);

    const title =
      parsed.success && parsed.data.title ? parsed.data.title : "New Coaching Session";

    const conversation = await createConversation(userId, title);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          id: conversation.id,
          clerkUserId: conversation.clerkUserId,
          title: conversation.title,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
        },
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
