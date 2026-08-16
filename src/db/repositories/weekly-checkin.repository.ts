/**
 * @fileoverview Weekly check-in repository — tracking sent email summaries.
 * @server-only
 */
import { eq, and, desc, gte, or } from "drizzle-orm";
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
  status?: WeeklyCheckinStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates a new weekly check-in record with `pending` status (or specified status).
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
      status: data.status ?? "pending",
      providerMessageId: data.providerMessageId ?? null,
      errorMessage: data.errorMessage ?? null,
      sentAt: data.sentAt ?? (data.status === "sent" ? now : null),
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
  limit = 50
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
 * Returns a single check-in scoped to the given Clerk user.
 */
export async function getCheckin(
  id: string,
  clerkUserId: string
): Promise<WeeklyCheckin | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.id, id),
        eq(weeklyCheckins.clerkUserId, clerkUserId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
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

/**
 * Checks whether a user has already received a check-in within a specific date window (idempotency).
 */
export async function hasCheckinInWindow(
  clerkUserId: string,
  sinceDate: Date
): Promise<boolean> {
  const db = getDb();

  const rows = await db
    .select({ id: weeklyCheckins.id })
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.clerkUserId, clerkUserId),
        gte(weeklyCheckins.createdAt, sinceDate),
        or(
          eq(weeklyCheckins.status, "sent"),
          eq(weeklyCheckins.status, "pending")
        )
      )
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Counts weekly check-ins for the given Clerk user, optionally filtered by status.
 */
export async function countCheckins(
  clerkUserId: string,
  status?: WeeklyCheckinStatus
): Promise<number> {
  const db = getDb();

  const conditions = status
    ? and(eq(weeklyCheckins.clerkUserId, clerkUserId), eq(weeklyCheckins.status, status))
    : eq(weeklyCheckins.clerkUserId, clerkUserId);

  const rows = await db
    .select({ id: weeklyCheckins.id })
    .from(weeklyCheckins)
    .where(conditions);

  return rows.length;
}
