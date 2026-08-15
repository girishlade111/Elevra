/**
 * @fileoverview Message repository — CRUD for `conversation_messages` table.
 * All queries are scoped by both conversationId and clerkUserId.
 * @server-only
 */
import { eq, and, desc, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { conversationMessages } from "@/db/schema/coaching";
import type {
  ConversationMessage,
  NewConversationMessage,
  MessageRole,
  Intent,
} from "@/db/schema/coaching";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateMessageData {
  conversationId: string;
  clerkUserId: string;
  role: MessageRole;
  content: string;
  intent?: Intent | null;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Inserts a new message into a conversation.
 */
export async function createMessage(data: CreateMessageData): Promise<ConversationMessage> {
  const db = getDb();
  const now = new Date();

  const [created] = await db
    .insert(conversationMessages)
    .values({
      id: nanoid(),
      conversationId: data.conversationId,
      clerkUserId: data.clerkUserId,
      role: data.role,
      content: data.content,
      intent: data.intent ?? null,
      createdAt: now,
    } satisfies NewConversationMessage)
    .returning();

  if (!created) throw new Error("[message.repository] createMessage: insert returned no rows");
  return created;
}

/**
 * Returns all messages in a conversation, scoped to the given Clerk user,
 * ordered oldest-first (natural conversation order).
 */
export async function getMessages(
  conversationId: string,
  clerkUserId: string
): Promise<ConversationMessage[]> {
  const db = getDb();

  return db
    .select()
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.clerkUserId, clerkUserId)
      )
    )
    .orderBy(asc(conversationMessages.createdAt));
}

/**
 * Returns the most recent `limit` messages in a conversation, scoped to the
 * given Clerk user, ordered newest-first.
 *
 * Useful for building an AI context window without loading the full history.
 */
export async function getRecentMessages(
  conversationId: string,
  clerkUserId: string,
  limit = 10
): Promise<ConversationMessage[]> {
  const db = getDb();

  return db
    .select()
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.clerkUserId, clerkUserId)
      )
    )
    .orderBy(desc(conversationMessages.createdAt))
    .limit(limit);
}

/**
 * Counts messages in a conversation (for pagination or token budget checks).
 */
export async function countMessages(
  conversationId: string,
  clerkUserId: string
): Promise<number> {
  const db = getDb();

  const rows = await db
    .select({ id: conversationMessages.id })
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.clerkUserId, clerkUserId)
      )
    );

  return rows.length;
}
