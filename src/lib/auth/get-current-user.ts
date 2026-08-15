import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserProfile } from "./sync-user";
import type { UserSession } from "@/types/user";

export interface CurrentUserResult extends UserSession {
  id: string; // Canonical identifier = Clerk userId
  firstName?: string;
  lastName?: string;
  isOnboarded: boolean;
}

/**
 * Returns the canonical Clerk userId for the active session, or null if unauthenticated.
 * Fast check that reads only the JWT claims without additional network calls.
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch (error) {
    console.error("Error retrieving Clerk userId:", error);
    return null;
  }
}

/**
 * Retrieves the current authenticated user from Clerk and ensures synchronization
 * with local application user records.
 * Returns typed CurrentUserResult or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<CurrentUserResult | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      "";

    const fullName = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
      : undefined;

    // Ensure local profile and retrieve onboarding state
    const { isOnboarded } = await ensureUserProfile({
      userId,
      email: primaryEmail,
      fullName,
      imageUrl: clerkUser.imageUrl,
    });

    return {
      id: userId,
      userId,
      email: primaryEmail,
      name: fullName,
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      imageUrl: clerkUser.imageUrl,
      isOnboarded,
    };
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}
