/**
 * @fileoverview Profiles table — one row per Clerk user.
 * clerk_user_id is the application identity; no separate users table needed.
 * @server-only
 */
import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums (stored as text with check constraint via pgEnum alternative)
// ---------------------------------------------------------------------------

/** Career stage options */
export const CAREER_STAGE_VALUES = [
  "student",
  "early_career",
  "mid_career",
  "senior",
  "executive",
  "career_changer",
] as const;
export type CareerStage = (typeof CAREER_STAGE_VALUES)[number];

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(), // nanoid
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    careerStage: text("career_stage").$type<CareerStage>(),
    challenge: text("challenge"),
    monthlyGoal: text("monthly_goal"),
    onboardingStep: integer("onboarding_step").notNull().default(0),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // One profile per Clerk user — enforced at DB level
    uniqueIndex("profiles_clerk_user_id_unique").on(table.clerkUserId),
    // Fast lookup by Clerk user
    index("profiles_clerk_user_id_idx").on(table.clerkUserId),
  ]
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
