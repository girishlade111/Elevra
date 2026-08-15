/**
 * @fileoverview Conversation repository — CRUD for `conversations` table.
 * All queries are scoped by clerkUserId so users can never access each other's data.
 * @server-only
 */
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { conversations } from "@/db/schema/coaching";
import type { Conversation, NewConversation } from "@/db/schema/coaching";

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates a new conversation container for the given Clerk user.
 */
export async function createConversation(
  clerkUserId: string,
  title = "New Conversation"
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
 * Deletes a conversation (and cascades to its messages via FK).
 * Scoped to the given Clerk user.
 */
export async function deleteConversation(
  id: string,
  clerkUserId: string
): Promise<void> {
  const db = getDb();

  await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.clerkUserId, clerkUserId)));
}
