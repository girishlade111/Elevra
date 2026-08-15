import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const weeklyCheckins = pgTable("weekly_checkins", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'generated' | 'sent' | 'failed'
  emailSubject: text("email_subject").notNull(),
  summaryContent: text("summary_content").notNull(),
  actionItems: jsonb("action_items").$type<string[]>().notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'resend' | 'gmail_smtp'
  recipientEmail: text("recipient_email").notNull(),
  templateType: text("template_type").notNull(),
  status: text("status").notNull(), // 'sent' | 'failed' | 'queued'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userEmailSettings = pgTable("user_email_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredProvider: text("preferred_provider").notNull().default("resend"),
  customApiKey: text("custom_api_key"),
  customFromEmail: text("custom_from_email"),
  customSmtpUser: text("custom_smtp_user"),
  customSmtpPass: text("custom_smtp_pass"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
