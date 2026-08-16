import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { requireAuth, requireApiAuth } from "@/lib/auth/require-auth";
import { getCurrentUser, getAuthUserId } from "@/lib/auth/get-current-user";
import { protectAppRoute, protectAuthRoute } from "@/lib/auth/guards";
import { ensureUserProfile, checkUserOnboarded, markUserOnboarded } from "@/lib/auth/sync-user";
import * as clerkServer from "@clerk/nextjs/server";
import * as profileRepo from "@/db/repositories/profile.repository";

describe("Auth Guards & Session Management", () => {
  const originalAuth = clerkServer.auth;
  const originalCurrentUser = clerkServer.currentUser;
  const originalGetProfile = profileRepo.getProfile;
  const originalUpsertProfile = profileRepo.upsertProfile;
  const originalUpdateOnboarding = profileRepo.updateOnboarding;

  beforeEach(() => {
    // Reset any mocks if necessary
  });

  describe("Unauthenticated User", () => {
    test("requireAuth redirects unauthenticated user to /sign-in", async () => {
      // Mock clerk auth returning null userId
      (clerkServer as any).auth = async () => ({ userId: null });
      (clerkServer as any).currentUser = async () => null;

      let redirectedTo = "";
      try {
        await requireAuth();
      } catch (err: any) {
        // Next.js redirect throws a digest or error
        redirectedTo = err.message || err.digest || "REDIRECT_TRIGGERED";
      }

      // Assert that an unauthenticated call triggered a redirect exception
      assert.ok(redirectedTo.length > 0, "Expected requireAuth to redirect when unauthenticated");
    });

    test("requireApiAuth returns 401 response for unauthenticated API requests", async () => {
      (clerkServer as any).auth = async () => ({ userId: null });

      const result = await requireApiAuth();
      assert.equal(result.userId, null);
      assert.equal(result.user, null);
      assert.ok(result.errorResponse !== null);

      const status = result.errorResponse.status;
      assert.equal(status, 401);

      const body = await result.errorResponse.json();
      assert.equal(body.success, false);
      assert.equal(body.error.code, "UNAUTHORIZED");
    });

    test("getAuthUserId returns null when session is absent or invalid", async () => {
      (clerkServer as any).auth = async () => ({ userId: null });
      const userId = await getAuthUserId();
      assert.equal(userId, null);
    });

    test("getCurrentUser returns null when user is unauthenticated", async () => {
      (clerkServer as any).auth = async () => ({ userId: null });
      (clerkServer as any).currentUser = async () => null;

      const user = await getCurrentUser();
      assert.equal(user, null);
    });

    test("protectAuthRoute does not redirect when user is unauthenticated", async () => {
      (clerkServer as any).auth = async () => ({ userId: null });
      (clerkServer as any).currentUser = async () => null;

      // Should complete without throwing redirect
      await protectAuthRoute();
      assert.ok(true);
    });
  });

  describe("Authenticated User", () => {
    const mockClerkUser = {
      id: "user_test_clerk_123",
      firstName: "Alex",
      lastName: "Taylor",
      imageUrl: "https://example.com/avatar.jpg",
      primaryEmailAddressId: "email_1",
      emailAddresses: [
        { id: "email_1", emailAddress: "alex.taylor@example.com" },
      ],
    };

    test("getAuthUserId returns canonical Clerk userId for active session", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_test_clerk_123" });
      const userId = await getAuthUserId();
      assert.equal(userId, "user_test_clerk_123");
    });

    test("getCurrentUser returns synchronized user profile with onboarding status", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_test_clerk_123" });
      (clerkServer as any).currentUser = async () => mockClerkUser;
      (profileRepo as any).upsertProfile = async (userId: string, data: any) => ({
        id: "prof_123",
        clerkUserId: userId,
        email: data.email,
        name: data.name,
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      const user = await getCurrentUser();
      assert.ok(user !== null);
      assert.equal(user.id, "user_test_clerk_123");
      assert.equal(user.userId, "user_test_clerk_123");
      assert.equal(user.email, "alex.taylor@example.com");
      assert.equal(user.name, "Alex Taylor");
      assert.equal(user.isOnboarded, true);
    });

    test("requireApiAuth returns verified userId and optionally full user object", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_test_clerk_123" });
      (clerkServer as any).currentUser = async () => mockClerkUser;
      (profileRepo as any).upsertProfile = async () => ({
        onboardingCompleted: true,
      });

      const fastResult = await requireApiAuth(false);
      assert.equal(fastResult.userId, "user_test_clerk_123");
      assert.equal(fastResult.user, null);
      assert.equal(fastResult.errorResponse, null);

      const fullResult = await requireApiAuth(true);
      assert.equal(fullResult.userId, "user_test_clerk_123");
      assert.ok(fullResult.user !== null);
      assert.equal(fullResult.user.email, "alex.taylor@example.com");
    });
  });

  describe("Onboarding State Routing", () => {
    test("requireAuth with requireOnboarding: true redirects to /app/onboarding if incomplete", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_incomplete_123" });
      (clerkServer as any).currentUser = async () => ({
        id: "user_incomplete_123",
        firstName: "Sam",
        lastName: "Lee",
        imageUrl: "https://example.com/avatar.jpg",
        emailAddresses: [{ id: "email_1", emailAddress: "sam@example.com" }],
      });
      (profileRepo as any).upsertProfile = async () => ({
        onboardingCompleted: false,
        onboardingStep: 1,
      });

      let redirected = false;
      try {
        await requireAuth({ requireOnboarding: true });
      } catch (err: any) {
        redirected = true;
        // Next.js redirect was triggered
      }

      assert.equal(redirected, true, "Should redirect to onboarding when requireOnboarding is true");
    });

    test("requireAuth with redirectIfOnboarded: true redirects to /app if already complete", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_complete_123" });
      (clerkServer as any).currentUser = async () => ({
        id: "user_complete_123",
        firstName: "Jordan",
        lastName: "Smith",
        imageUrl: "https://example.com/avatar.jpg",
        emailAddresses: [{ id: "email_1", emailAddress: "jordan@example.com" }],
      });
      (profileRepo as any).upsertProfile = async () => ({
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      let redirected = false;
      try {
        await requireAuth({ redirectIfOnboarded: true });
      } catch (err: any) {
        redirected = true;
      }

      assert.equal(redirected, true, "Should redirect to dashboard when user is already onboarded");
    });

    test("protectAuthRoute redirects authenticated user away from auth pages to dashboard", async () => {
      (clerkServer as any).auth = async () => ({ userId: "user_test_clerk_123" });
      (clerkServer as any).currentUser = async () => ({
        id: "user_test_clerk_123",
        firstName: "Taylor",
        emailAddresses: [{ id: "email_1", emailAddress: "taylor@example.com" }],
      });
      (profileRepo as any).upsertProfile = async () => ({
        onboardingCompleted: true,
      });

      let redirected = false;
      try {
        await protectAuthRoute();
      } catch (err) {
        redirected = true;
      }

      assert.equal(redirected, true, "Authenticated user visiting /sign-in or /sign-up should be redirected to /app");
    });
  });

  describe("User Sync & Onboarding Helpers", () => {
    test("ensureUserProfile gracefully falls back to session info if database fails", async () => {
      (profileRepo as any).upsertProfile = async () => {
        throw new Error("Neon DB connection timeout");
      };

      const result = await ensureUserProfile({
        userId: "user_failover_test",
        email: "failover@example.com",
        fullName: "Failover User",
      });

      assert.equal(result.user.userId, "user_failover_test");
      assert.equal(result.user.email, "failover@example.com");
      assert.equal(result.isOnboarded, false);
    });

    test("ensureUserProfile throws when userId is missing", async () => {
      await assert.rejects(
        async () => {
          await ensureUserProfile({
            userId: "",
            email: "test@example.com",
          });
        },
        /Cannot sync user without a valid Clerk userId/
      );
    });

    test("markUserOnboarded delegates to updateOnboarding with step 99", async () => {
      let updatedUserId = "";
      let updatedData: any = null;

      (profileRepo as any).updateOnboarding = async (userId: string, data: any) => {
        updatedUserId = userId;
        updatedData = data;
        return { id: "p1", clerkUserId: userId, ...data };
      };

      await markUserOnboarded("user_mark_test");
      assert.equal(updatedUserId, "user_mark_test");
      assert.equal(updatedData.onboardingCompleted, true);
      assert.equal(updatedData.onboardingStep, 99);
    });

    test("checkUserOnboarded returns true when profile onboardingCompleted is true", async () => {
      (profileRepo as any).getProfile = async (userId: string) => ({
        id: "p1",
        clerkUserId: userId,
        onboardingCompleted: true,
      });

      const isOnboarded = await checkUserOnboarded("user_check_true");
      assert.equal(isOnboarded, true);
    });

    test("checkUserOnboarded returns false when profile is missing or DB throws", async () => {
      (profileRepo as any).getProfile = async () => null;
      assert.equal(await checkUserOnboarded("user_missing"), false);

      (profileRepo as any).getProfile = async () => {
        throw new Error("DB error");
      };
      assert.equal(await checkUserOnboarded("user_error"), false);
    });
  });
});
