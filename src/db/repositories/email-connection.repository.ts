/**
 * @fileoverview Email Connection repository — encrypted Gmail credential storage.
 *
 * SECURITY CONTRACT:
 * - `getEmailConnection` NEVER returns `encryptedAppPassword`.
 * - `getEmailConnectionWithCredentials` decrypts in-process and returns the
 *   plaintext. It MUST NOT be serialized to HTTP responses.
 * - Only `upsertEmailConnection` accepts the plaintext and immediately encrypts.
 *
 * @server-only
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { gmailConnections } from "@/db/schema/emails";
import type {
  GmailConnection,
  GmailConnectionPublic,
  NewGmailConnection,
  EmailProvider,
} from "@/db/schema/emails";
import { encryptCredential, decryptCredential } from "@/lib/security/encryption";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpsertEmailConnectionData {
  email: string;
  /** Plaintext Gmail App Password — will be encrypted before storage */
  appPassword: string;
  provider?: EmailProvider;
}

export interface EmailConnectionWithCredentials extends GmailConnectionPublic {
  /** Decrypted App Password — NEVER include in API responses */
  appPassword: string;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates or updates a Gmail connection for the given Clerk user.
 * Encrypts the App Password before storage.
 */
export async function upsertEmailConnection(
  clerkUserId: string,
  data: UpsertEmailConnectionData
): Promise<GmailConnectionPublic> {
  const db = getDb();
  const now = new Date();
  const encryptedAppPassword = encryptCredential(data.appPassword);
  const provider: EmailProvider = data.provider ?? "gmail";

  const existing = await db
    .select({ id: gmailConnections.id })
    .from(gmailConnections)
    .where(eq(gmailConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const [updated] = await db
      .update(gmailConnections)
      .set({
        email: data.email,
        encryptedAppPassword,
        provider,
        isConnected: true,
        updatedAt: now,
      })
      .where(eq(gmailConnections.clerkUserId, clerkUserId))
      .returning();

    if (!updated)
      throw new Error("[email-connection.repository] upsertEmailConnection: update returned no rows");

    const { encryptedAppPassword: _omitted, ...safe } = updated;
    void _omitted;
    return safe;
  }

  const [created] = await db
    .insert(gmailConnections)
    .values({
      id: nanoid(),
      clerkUserId,
      email: data.email,
      encryptedAppPassword,
      provider,
      isConnected: true,
      lastTestedAt: null,
      createdAt: now,
      updatedAt: now,
    } satisfies NewGmailConnection)
    .returning();

  if (!created)
    throw new Error("[email-connection.repository] upsertEmailConnection: insert returned no rows");

  const { encryptedAppPassword: _omitted2, ...safe } = created;
  void _omitted2;
  return safe;
}

/**
 * Returns the public (safe) email connection record for the given Clerk user.
 * Does NOT include the encrypted credential.
 */
export async function getEmailConnection(
  clerkUserId: string
): Promise<GmailConnectionPublic | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!rows[0]) return null;
  const { encryptedAppPassword: _omitted, ...safe } = rows[0];
  void _omitted;
  return safe;
}

/**
 * Returns the email connection record WITH the decrypted App Password.
 *
 * @security This function is for server-side use ONLY — e.g. when sending
 *           an email. NEVER serialize the returned `appPassword` to an API
 *           response or client component.
 */
export async function getEmailConnectionWithCredentials(
  clerkUserId: string
): Promise<EmailConnectionWithCredentials | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.clerkUserId, clerkUserId))
    .limit(1);

  if (!rows[0]) return null;

  const { encryptedAppPassword, ...safe } = rows[0];
  const appPassword = decryptCredential(encryptedAppPassword);

  return { ...safe, appPassword };
}

/**
 * Marks a connection as tested (updates `last_tested_at` and `is_connected`).
 */
export async function updateLastTested(
  clerkUserId: string,
  isConnected: boolean
): Promise<void> {
  const db = getDb();

  await db
    .update(gmailConnections)
    .set({
      isConnected,
      lastTestedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(gmailConnections.clerkUserId, clerkUserId));
}

/**
 * Removes the Gmail connection for the given Clerk user.
 */
export async function deleteEmailConnection(clerkUserId: string): Promise<void> {
  const db = getDb();

  await db
    .delete(gmailConnections)
    .where(eq(gmailConnections.clerkUserId, clerkUserId));
}
