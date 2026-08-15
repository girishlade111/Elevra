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
// Enums & Option Values
// ---------------------------------------------------------------------------

/** Career stage options from onboarding workflow */
export const CAREER_STAGE_VALUES = [
  "Student or Fresh Graduate",
  "Early Career (1-3 years)",
  "Mid Career (4-8 years)",
  "Senior or Leadership",
  "Career Changer",
  // Legacy / slug fallbacks
  "student",
  "early_career",
  "mid_career",
  "senior",
  "executive",
  "career_changer",
] as const;
export type CareerStage = (typeof CAREER_STAGE_VALUES)[number] | string;

/** Primary challenge options from onboarding workflow */
export const CHALLENGE_VALUES = [
  "Salary negotiation",
  "Interview confidence",
  "Career change or pivot",
  "Leadership and assertiveness",
  "Work-life balance",
  "Building my network",
] as const;
export type ChallengeOption = (typeof CHALLENGE_VALUES)[number] | string;


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
