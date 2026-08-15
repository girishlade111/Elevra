/**
 * @fileoverview Email tables:
 *   - gmail_connections   (encrypted credential storage)
 *   - email_preferences
 *   - weekly_checkins
 * @server-only
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const EMAIL_PROVIDER_VALUES = ["resend", "gmail"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDER_VALUES)[number];

export const WEEKLY_CHECKIN_STATUS_VALUES = [
  "pending",
  "sent",
  "failed",
  "skipped",
] as const;
export type WeeklyCheckinStatus = (typeof WEEKLY_CHECKIN_STATUS_VALUES)[number];

// ---------------------------------------------------------------------------
// gmail_connections
// ---------------------------------------------------------------------------
// NOTE: encrypted_app_password stores an AES-256-GCM ciphertext string.
// NEVER return this field in API responses. Use the email-connection repository
// helper that decrypts in-process only.

export const gmailConnections = pgTable(
  "gmail_connections",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    /** AES-256-GCM ciphertext: "iv:authTag:ciphertext" (all hex-encoded) */
    encryptedAppPassword: text("encrypted_app_password").notNull(),
    provider: text("provider").$type<EmailProvider>().notNull().default("gmail"),
    isConnected: boolean("is_connected").notNull().default(true),
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // One Gmail connection per Clerk user
    uniqueIndex("gmail_connections_clerk_user_id_unique").on(table.clerkUserId),
    index("gmail_connections_clerk_user_id_idx").on(table.clerkUserId),
  ]
);

export type GmailConnection = typeof gmailConnections.$inferSelect;
export type NewGmailConnection = typeof gmailConnections.$inferInsert;

/** Safe public type — omits the encrypted credential */
export type GmailConnectionPublic = Omit<GmailConnection, "encryptedAppPassword">;

// ---------------------------------------------------------------------------
// email_preferences
// ---------------------------------------------------------------------------

export const emailPreferences = pgTable(
  "email_preferences",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    provider: text("provider").$type<EmailProvider>().notNull().default("resend"),
    weeklyCheckinsEnabled: boolean("weekly_checkins_enabled").notNull().default(true),
    destinationEmail: text("destination_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // One preference row per Clerk user
    uniqueIndex("email_preferences_clerk_user_id_unique").on(table.clerkUserId),
    index("email_preferences_clerk_user_id_idx").on(table.clerkUserId),
  ]
);

export type EmailPreference = typeof emailPreferences.$inferSelect;
export type NewEmailPreference = typeof emailPreferences.$inferInsert;

// ---------------------------------------------------------------------------
// weekly_checkins
// ---------------------------------------------------------------------------

export const weeklyCheckins = pgTable(
  "weekly_checkins",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    provider: text("provider").$type<EmailProvider>().notNull(),
    recipientEmail: text("recipient_email").notNull(),
    subject: text("subject").notNull(),
    content: text("content").notNull(),
    status: text("status").$type<WeeklyCheckinStatus>().notNull().default("pending"),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("weekly_checkins_clerk_user_id_idx").on(table.clerkUserId),
    index("weekly_checkins_created_at_idx").on(table.createdAt),
    index("weekly_checkins_status_idx").on(table.status),
  ]
);

export type WeeklyCheckin = typeof weeklyCheckins.$inferSelect;
export type NewWeeklyCheckin = typeof weeklyCheckins.$inferInsert;
