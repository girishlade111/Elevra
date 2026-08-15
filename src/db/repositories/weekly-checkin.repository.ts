/**
 * @fileoverview Weekly check-in repository — tracking sent email summaries.
 * @server-only
 */
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { weeklyCheckins } from "@/db/schema/emails";
import type {
  WeeklyCheckin,
  NewWeeklyCheckin,
  EmailProvider,
  WeeklyCheckinStatus,
} from "@/db/schema/emails";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateCheckinData {
  clerkUserId: string;
  provider: EmailProvider;
  recipientEmail: string;
  subject: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates a new weekly check-in record with `pending` status.
 */
export async function createCheckin(data: CreateCheckinData): Promise<WeeklyCheckin> {
  const db = getDb();
  const now = new Date();

  const [created] = await db
    .insert(weeklyCheckins)
    .values({
      id: nanoid(),
      clerkUserId: data.clerkUserId,
      provider: data.provider,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      content: data.content,
      status: "pending",
      providerMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: now,
    } satisfies NewWeeklyCheckin)
    .returning();

  if (!created)
    throw new Error("[weekly-checkin.repository] createCheckin: insert returned no rows");
  return created;
}

/**
 * Updates the status of a check-in after an attempt to send it.
 */
export async function updateCheckinStatus(
  id: string,
  status: WeeklyCheckinStatus,
  providerMessageId?: string | null,
  errorMessage?: string | null
): Promise<void> {
  const db = getDb();

  await db
    .update(weeklyCheckins)
    .set({
      status,
      providerMessageId: providerMessageId ?? null,
      errorMessage: errorMessage ?? null,
      sentAt: status === "sent" ? new Date() : null,
    })
    .where(eq(weeklyCheckins.id, id));
}

/**
 * Lists the most recent check-ins for the given Clerk user, newest-first.
 */
export async function listCheckins(
  clerkUserId: string,
  limit = 20
): Promise<WeeklyCheckin[]> {
  const db = getDb();

  return db
    .select()
    .from(weeklyCheckins)
    .where(eq(weeklyCheckins.clerkUserId, clerkUserId))
    .orderBy(desc(weeklyCheckins.createdAt))
    .limit(limit);
}

/**
 * Returns the most recent check-in for the given Clerk user, or null.
 * Used to determine whether to schedule the next one.
 */
export async function getLastCheckin(
  clerkUserId: string
): Promise<WeeklyCheckin | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(weeklyCheckins)
    .where(eq(weeklyCheckins.clerkUserId, clerkUserId))
    .orderBy(desc(weeklyCheckins.createdAt))
    .limit(1);

  return rows[0] ?? null;
}
