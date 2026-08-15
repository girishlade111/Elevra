import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserSession } from "@/types/user";

/**
 * Returns current authenticated user session or null
 */
export async function getAuthSession(): Promise<UserSession | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    if (!user) return null;

    return {
      userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name: user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : undefined,
      imageUrl: user.imageUrl,
    };
  } catch (error) {
    console.error("Error retrieving Clerk auth session:", error);
    return null;
  }
}

/**
 * Asserts user is authenticated, throwing an Error if not
 */
export async function requireAuthSession(): Promise<UserSession> {
  const session = await getAuthSession();
  if (!session || !session.userId) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return session;
}
