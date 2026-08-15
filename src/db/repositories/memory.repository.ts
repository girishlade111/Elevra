/**
 * @fileoverview Conversation memory repository — single running summary per user.
 *
 * The memory row stores a compressed narrative of the user's coaching history.
 * It is fed into the AI system prompt to give the model long-term context.
 * Only one memory row exists per user (enforced by UNIQUE on clerk_user_id).
 *
 * @server-only
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { conversationMemory } from "@/db/schema/coaching";
import type { ConversationMemory, NewConversationMemory } from "@/db/schema/coaching";

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates or replaces the conversation memory summary for the given Clerk user.
 */
export async function upsertMemory(
  clerkUserId: string,
  summary: string
): Promise<ConversationMemory> {
  const db = getDb();
  const now = new Date();

  const existing = await db
    .select()
    .from(conversationMemory)
    .where(eq(conversationMemory.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const [updated] = await db
      .update(conversationMemory)
      .set({ summary, updatedAt: now })
      .where(eq(conversationMemory.clerkUserId, clerkUserId))
      .returning();

    if (!updated)
      throw new Error("[memory.repository] upsertMemory: update returned no rows");
    return updated;
  }

  const [created] = await db
    .insert(conversationMemory)
    .values({
      id: nanoid(),
      clerkUserId,
      summary,
      createdAt: now,
      updatedAt: now,
    } satisfies NewConversationMemory)
    .returning();

  if (!created)
    throw new Error("[memory.repository] upsertMemory: insert returned no rows");
  return created;
}

/**
 * Returns the conversation memory summary for the given Clerk user, or null.
 */
export async function getMemory(clerkUserId: string): Promise<ConversationMemory | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(conversationMemory)
    .where(eq(conversationMemory.clerkUserId, clerkUserId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Deletes the conversation memory for the given Clerk user.
 * Useful when resetting the coaching context.
 */
export async function deleteMemory(clerkUserId: string): Promise<void> {
  const db = getDb();

  await db
    .delete(conversationMemory)
    .where(eq(conversationMemory.clerkUserId, clerkUserId));
}
