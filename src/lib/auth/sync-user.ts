/**
 * @fileoverview User sync — ensures a profile row exists for the Clerk user
 * and resolves onboarding status. Uses the profile repository.
 * @server-only
 */
import { getProfile, upsertProfile } from "@/db/repositories/profile.repository";
import type { UserSession } from "@/types/user";

export interface SyncUserData {
  userId: string;
  email: string;
  fullName?: string;
  imageUrl?: string;
}

export interface SyncUserResult {
  user: UserSession;
  isOnboarded: boolean;
}

/**
 * Ensures a local application profile record exists for the given Clerk user.
 * - Idempotent: upserts so repeated calls are safe.
 * - Resolves onboarding completion from the `profiles` table.
 * - Never trusts client-supplied user IDs.
 */
export async function ensureUserProfile(data: SyncUserData): Promise<SyncUserResult> {
  const { userId, email, fullName, imageUrl } = data;

  if (!userId) {
    throw new Error("Cannot sync user without a valid Clerk userId.");
  }

  try {
    const profile = await upsertProfile(userId, {
      email,
      name: fullName ?? null,
    });

    return {
      user: {
        userId,
        email,
        name: fullName,
        imageUrl,
      },
      isOnboarded: profile.onboardingCompleted,
    };
  } catch (error) {
    console.warn("[sync-user] Database sync failed, returning session-only fallback:", error);

    // Graceful fallback — still lets the user access the app
    return {
      user: { userId, email, name: fullName, imageUrl },
      isOnboarded: false,
    };
  }
}

/**
 * Mark a user's onboarding as completed.
 * Delegates to the profile repository.
 */
export async function markUserOnboarded(userId: string): Promise<void> {
  try {
    await upsertProfile(userId, { email: "" }); // keep existing email
    const { updateOnboarding } = await import("@/db/repositories/profile.repository");
    await updateOnboarding(userId, { onboardingCompleted: true, onboardingStep: 99 });
  } catch (error) {
    console.warn("[sync-user] markUserOnboarded failed:", error);
  }
}

/**
 * Check if a user has completed onboarding.
 */
export async function checkUserOnboarded(userId: string): Promise<boolean> {
  try {
    const profile = await getProfile(userId);
    return profile?.onboardingCompleted ?? false;
  } catch {
    return false;
  }
}
