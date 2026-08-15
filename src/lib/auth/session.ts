import { getCurrentUser } from "./get-current-user";
import { requireAuth } from "./require-auth";
import type { UserSession } from "@/types/user";

/**
 * Returns current authenticated user session or null
 */
export async function getAuthSession(): Promise<UserSession | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
  };
}

/**
 * Asserts user is authenticated, throwing an Error if not
 */
export async function requireAuthSession(): Promise<UserSession> {
  const user = await requireAuth();
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    imageUrl: user.imageUrl,
  };
}
