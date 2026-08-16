import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/require-auth";
import {
  getConversation,
  deleteConversation,
} from "@/db/repositories/conversation.repository";
import { getMessages } from "@/db/repositories/message.repository";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;
    const { id } = await params;

    // Strict user isolation check
    const conversation = await getConversation(id, userId);
    if (!conversation) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Conversation not found or you do not have permission to view it.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const rawMessages = await getMessages(id, userId);

    const formattedMessages = rawMessages.map((m) => {
      let structured = null;
      if (m.role === "assistant") {
        try {
          structured = JSON.parse(m.content);
        } catch {
          structured = null;
        }
      }

      return {
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        structured,
        intent: m.intent,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            clerkUserId: conversation.clerkUserId,
            title: conversation.title,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
          },
          messages: formattedMessages,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API GET /api/conversations/[id] error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to load conversation details",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiAuth();
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }

    const { userId } = authResult;
    const { id } = await params;

    // Strict ownership verification before deletion
    const conversation = await getConversation(id, userId);
    if (!conversation) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Conversation not found or you do not have permission to delete it.",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    await deleteConversation(id, userId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { id },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API DELETE /api/conversations/[id] error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete conversation",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
