import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk userId
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredName: text("preferred_name"),
  primaryGoal: text("primary_goal").notNull(),
  confidenceAreas: jsonb("confidence_areas").$type<string[]>().notNull(),
  currentChallenge: text("current_challenge").notNull(),
  baselineScore: integer("baseline_score").notNull().default(5),
  coachingTone: text("coaching_tone").notNull().default("supportive"),
  emailUpdatesEnabled: boolean("email_updates_enabled").notNull().default(true),
  preferredEmailTime: text("preferred_email_time").notNull().default("09:00"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
