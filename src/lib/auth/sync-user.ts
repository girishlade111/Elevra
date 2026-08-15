import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
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

// In-memory fallback cache for development or when DATABASE_URL is not set
const memoryUserStore = new Map<
  string,
  {
    userId: string;
    email: string;
    fullName?: string;
    imageUrl?: string;
    isOnboarded: boolean;
    createdAt: string;
    updatedAt: string;
  }
>();

/**
 * Ensures a local application user and profile record exists for the given Clerk user.
 * - Idempotent: checks for existing user to avoid duplication.
 * - Resolves onboarding completion status from the profile table or fallback store.
 * - Never trusts client-supplied user IDs.
 */
export async function ensureUserProfile(data: SyncUserData): Promise<SyncUserResult> {
  const { userId, email, fullName, imageUrl } = data;

  if (!userId) {
    throw new Error("Cannot sync user without a valid Clerk userId.");
  }

  const db = getDb();

  // If database connection is configured
  if (db) {
    try {
      // 1. Check if user already exists
      const existingUsers = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (existingUsers.length === 0) {
        // Create user record
        await db.insert(schema.users).values({
          id: userId,
          email,
          fullName: fullName ?? null,
          imageUrl: imageUrl ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else if (
        fullName &&
        existingUsers[0] &&
        existingUsers[0].fullName !== fullName
      ) {
        // Update user name/image if changed in Clerk
        await db
          .update(schema.users)
          .set({
            fullName,
            imageUrl: imageUrl ?? existingUsers[0].imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));
      }

      // 2. Check onboarding status from profiles table
      const existingProfiles = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1);

      const isOnboarded = existingProfiles.length > 0;

      return {
        user: {
          userId,
          email,
          name: fullName,
          imageUrl,
        },
        isOnboarded,
      };
    } catch (error) {
      console.warn("Database sync fallback engaged due to DB error:", error);
    }
  }

  // Fallback in-memory profile persistence when database is not connected
  const existing = memoryUserStore.get(userId);
  if (!existing) {
    memoryUserStore.set(userId, {
      userId,
      email,
      fullName,
      imageUrl,
      isOnboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      user: {
        userId,
        email,
        name: fullName,
        imageUrl,
      },
      isOnboarded: false,
    };
  }

  return {
    user: {
      userId: existing.userId,
      email: existing.email,
      name: existing.fullName,
      imageUrl: existing.imageUrl,
    },
    isOnboarded: existing.isOnboarded,
  };
}

/**
 * Mark a user's onboarding as completed in the fallback store or database.
 */
export async function markUserOnboarded(userId: string): Promise<void> {
  const existing = memoryUserStore.get(userId);
  if (existing) {
    existing.isOnboarded = true;
    existing.updatedAt = new Date().toISOString();
  }
}

/**
 * Check if a user has completed onboarding.
 */
export async function checkUserOnboarded(userId: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    try {
      const existingProfiles = await db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, userId))
        .limit(1);
      return existingProfiles.length > 0;
    } catch {
      // fallback
    }
  }

  return memoryUserStore.get(userId)?.isOnboarded ?? false;
}
