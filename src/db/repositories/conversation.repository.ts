/**
 * @fileoverview Conversation repository — CRUD for `conversations` table.
 * All queries are scoped by clerkUserId so users can never access each other's data.
 * @server-only
 */
import { eq, and, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { conversations, conversationMessages } from "@/db/schema/coaching";
import type { Conversation, NewConversation } from "@/db/schema/coaching";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationWithDetails extends Conversation {
  messageCount: number;
  lastMessagePreview: string | null;
  lastIntent: string | null;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates a new conversation container for the given Clerk user.
 */
export async function createConversation(
  clerkUserId: string,
  title = "New Coaching Session"
): Promise<Conversation> {
  const db = getDb();
  const now = new Date();

  const [created] = await db
    .insert(conversations)
    .values({
      id: nanoid(),
      clerkUserId,
      title,
      createdAt: now,
      updatedAt: now,
    } satisfies NewConversation)
    .returning();

  if (!created) throw new Error("[conversation.repository] createConversation: insert returned no rows");
  return created;
}

/**
 * Returns a single conversation, scoped to the given Clerk user.
 * Returns null if not found or if the conversation belongs to a different user.
 */
export async function getConversation(
  id: string,
  clerkUserId: string
): Promise<Conversation | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Lists conversations for the given Clerk user, ordered newest-first.
 */
export async function listConversations(
  clerkUserId: string,
  limit = 50
): Promise<Conversation[]> {
  const db = getDb();

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.clerkUserId, clerkUserId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

/**
 * Lists conversations with enriched metadata (message count, last message preview, last intent).
 */
export async function listConversationsWithDetails(
  clerkUserId: string,
  limit = 50
): Promise<ConversationWithDetails[]> {
  const db = getDb();

  const convList = await db
    .select()
    .from(conversations)
    .where(eq(conversations.clerkUserId, clerkUserId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  if (convList.length === 0) {
    return [];
  }

  const convIds = convList.map((c) => c.id);

  // Fetch all messages for these conversations to compute counts and last previews
  const allMessages = await db
    .select({
      id: conversationMessages.id,
      conversationId: conversationMessages.conversationId,
      role: conversationMessages.role,
      content: conversationMessages.content,
      intent: conversationMessages.intent,
      createdAt: conversationMessages.createdAt,
    })
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.clerkUserId, clerkUserId),
        inArray(conversationMessages.conversationId, convIds)
      )
    )
    .orderBy(desc(conversationMessages.createdAt));

  // Map messages by conversationId
  const messagesByConv = new Map<string, typeof allMessages>();
  for (const msg of allMessages) {
    const list = messagesByConv.get(msg.conversationId) || [];
    list.push(msg);
    messagesByConv.set(msg.conversationId, list);
  }

  return convList.map((conv) => {
    const msgs = messagesByConv.get(conv.id) || [];
    const messageCount = msgs.length;
    const latestMessage = msgs[0] ?? null;

    let lastMessagePreview: string | null = null;
    let lastIntent: string | null = null;

    if (latestMessage) {
      lastIntent = latestMessage.intent;
      try {
        if (latestMessage.role === "assistant") {
          const parsed = JSON.parse(latestMessage.content);
          lastMessagePreview = parsed.main_advice || parsed.coachingMessage || latestMessage.content;
        } else {
          lastMessagePreview = latestMessage.content;
        }
      } catch {
        lastMessagePreview = latestMessage.content;
      }

      if (lastMessagePreview && lastMessagePreview.length > 120) {
        lastMessagePreview = lastMessagePreview.slice(0, 117).trim() + "...";
      }
    }

    return {
      ...conv,
      messageCount,
      lastMessagePreview,
      lastIntent,
    };
  });
}

/**
 * Updates the title of a conversation, scoped to the given Clerk user.
 */
export async function updateConversationTitle(
  id: string,
  clerkUserId: string,
  title: string
): Promise<void> {
  const db = getDb();

  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)));
}

/**
 * Touches the `updated_at` timestamp — call this when a new message is added.
 */
export async function touchConversation(
  id: string,
  clerkUserId: string
): Promise<void> {
  const db = getDb();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)));
}

/**
 * Deletes a conversation (and explicitly deletes messages for safety).
 * Scoped strictly to the given Clerk user.
 */
export async function deleteConversation(
  id: string,
  clerkUserId: string
): Promise<void> {
  const db = getDb();

  // Explicit message cleanup for databases where cascade might be manual
  await db
    .delete(conversationMessages)
    .where(
      and(
        eq(conversationMessages.conversationId, id),
        eq(conversationMessages.clerkUserId, clerkUserId)
      )
    );

  await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)));
}
