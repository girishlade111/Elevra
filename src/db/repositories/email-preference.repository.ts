/**
 * @fileoverview Email preference repository — one preference row per user.
 * @server-only
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { emailPreferences } from "@/db/schema/emails";
import type { EmailPreference, NewEmailPreference, EmailProvider } from "@/db/schema/emails";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpsertEmailPreferenceData {
  provider?: EmailProvider;
  weeklyCheckinsEnabled?: boolean;
  destinationEmail?: string | null;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates or updates email preferences for the given Clerk user.
 */
export async function upsertEmailPreference(
  clerkUserId: string,
  data: UpsertEmailPreferenceData
): Promise<EmailPreference> {
  const db = getDb();
  const now = new Date();

  const existing = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const [updated] = await db
      .update(emailPreferences)
      .set({
        provider: data.provider ?? existing[0].provider,
        weeklyCheckinsEnabled:
          data.weeklyCheckinsEnabled ?? existing[0].weeklyCheckinsEnabled,
        destinationEmail:
          data.destinationEmail !== undefined
            ? data.destinationEmail
            : existing[0].destinationEmail,
        updatedAt: now,
      })
      .where(eq(emailPreferences.clerkUserId, clerkUserId))
      .returning();

    if (!updated)
      throw new Error(
        "[email-preference.repository] upsertEmailPreference: update returned no rows"
      );
    return updated;
  }

  const [created] = await db
    .insert(emailPreferences)
    .values({
      id: nanoid(),
      clerkUserId,
      provider: data.provider ?? "resend",
      weeklyCheckinsEnabled: data.weeklyCheckinsEnabled ?? true,
      destinationEmail: data.destinationEmail ?? null,
      createdAt: now,
      updatedAt: now,
    } satisfies NewEmailPreference)
    .returning();

  if (!created)
    throw new Error(
      "[email-preference.repository] upsertEmailPreference: insert returned no rows"
    );
  return created;
}

/**
 * Returns email preferences for the given Clerk user, or null if not configured.
 */
export async function getEmailPreference(
  clerkUserId: string
): Promise<EmailPreference | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.clerkUserId, clerkUserId))
    .limit(1);

  return rows[0] ?? null;
}
