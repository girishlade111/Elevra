/**
 * @fileoverview Profile repository — CRUD operations for the `profiles` table.
 * @server-only
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { profiles } from "@/db/schema/users";
import type { Profile, NewProfile, CareerStage } from "@/db/schema/users";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpsertProfileData {
  email: string;
  name?: string | null;
  careerStage?: CareerStage | null;
  challenge?: string | null;
  monthlyGoal?: string | null;
}

export interface UpdateOnboardingData {
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  careerStage?: CareerStage;
  challenge?: string;
  monthlyGoal?: string;
}

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Creates a new profile or updates an existing one for the given Clerk user.
 */
export async function upsertProfile(
  clerkUserId: string,
  data: UpsertProfileData
): Promise<Profile> {
  const db = getDb();
  const now = new Date();

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const [updated] = await db
      .update(profiles)
      .set({
        email: data.email,
        name: data.name ?? existing[0].name,
        careerStage: data.careerStage ?? existing[0].careerStage,
        challenge: data.challenge ?? existing[0].challenge,
        monthlyGoal: data.monthlyGoal ?? existing[0].monthlyGoal,
        updatedAt: now,
        lastActiveAt: now,
      })
      .where(eq(profiles.clerkUserId, clerkUserId))
      .returning();

    if (!updated) throw new Error("[profile.repository] upsertProfile: update returned no rows");
    return updated;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      id: nanoid(),
      clerkUserId,
      email: data.email,
      name: data.name ?? null,
      careerStage: data.careerStage ?? null,
      challenge: data.challenge ?? null,
      monthlyGoal: data.monthlyGoal ?? null,
      onboardingStep: 0,
      onboardingCompleted: false,
      joinedAt: now,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    } satisfies NewProfile)
    .returning();

  if (!created) throw new Error("[profile.repository] upsertProfile: insert returned no rows");
  return created;
}

/**
 * Returns the profile for the given Clerk user, or null if not found.
 */
export async function getProfile(clerkUserId: string): Promise<Profile | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Updates onboarding progress for the given Clerk user.
 */
export async function updateOnboarding(
  clerkUserId: string,
  data: UpdateOnboardingData
): Promise<void> {
  const db = getDb();

  await db
    .update(profiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(profiles.clerkUserId, clerkUserId));
}

/**
 * Updates the `last_active_at` timestamp (heartbeat) for the given Clerk user.
 */
export async function updateLastActive(clerkUserId: string): Promise<void> {
  const db = getDb();

  await db
    .update(profiles)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.clerkUserId, clerkUserId));
}
