import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { requireAuth, requireApiAuth } from "@/lib/auth/require-auth";
import { getCurrentUser, getAuthUserId, setAuthMock } from "@/lib/auth/get-current-user";
import { protectAppRoute, protectAuthRoute } from "@/lib/auth/guards";
import { ensureUserProfile, checkUserOnboarded, markUserOnboarded } from "@/lib/auth/sync-user";
import { setTestDb } from "@/db";

describe("Auth Guards & Session Management", () => {
  beforeEach(() => {
    setAuthMock(null, null);
    setTestDb(null);
  });

  describe("Unauthenticated User", () => {
    test("requireAuth redirects unauthenticated user to /sign-in", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);

      let redirectedTo = "";
      try {
        await requireAuth();
      } catch (err: any) {
        redirectedTo = err.message || err.digest || "NEXT_REDIRECT";
      }

      assert.ok(redirectedTo.length > 0, "Expected requireAuth to redirect when unauthenticated");
    });

    test("requireApiAuth returns 401 response for unauthenticated API requests", async () => {
      setAuthMock(async () => ({ userId: null }));

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
      setAuthMock(async () => ({ userId: null }));
      const userId = await getAuthUserId();
      assert.equal(userId, null);
    });

    test("getCurrentUser returns null when user is unauthenticated", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);
      const user = await getCurrentUser();
      assert.equal(user, null);
    });

    test("protectAuthRoute does not redirect when user is unauthenticated", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);
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
      setAuthMock(async () => ({ userId: "user_test_clerk_123" }));
      const userId = await getAuthUserId();
      assert.equal(userId, "user_test_clerk_123");
    });

    test("getCurrentUser returns synchronized user profile with onboarding status", async () => {
      setAuthMock(
        async () => ({ userId: "user_test_clerk_123" }),
        async () => mockClerkUser
      );

      // We don't have a live DB connection in pure unit test, so sync-user's fallback gracefully sets session info
      const user = await getCurrentUser();
      assert.ok(user !== null);
      assert.equal(user.id, "user_test_clerk_123");
      assert.equal(user.userId, "user_test_clerk_123");
      assert.equal(user.email, "alex.taylor@example.com");
      assert.equal(user.name, "Alex Taylor");
      assert.equal(typeof user.isOnboarded, "boolean");
    });

    test("requireApiAuth returns verified userId and optionally full user object", async () => {
      setAuthMock(
        async () => ({ userId: "user_test_clerk_123" }),
        async () => mockClerkUser
      );

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
    test("protectAuthRoute redirects authenticated user away from auth pages to dashboard", async () => {
      setAuthMock(
        async () => ({ userId: "user_test_clerk_123" }),
        async () => ({
          id: "user_test_clerk_123",
          firstName: "Taylor",
          emailAddresses: [{ id: "email_1", emailAddress: "taylor@example.com" }],
        })
      );

      let redirected = false;
      try {
        await protectAuthRoute();
      } catch (err) {
        redirected = true;
      }

      assert.equal(redirected, true, "Authenticated user visiting /sign-in should be redirected to /app");
    });
  });

  describe("User Sync & Fallback Behavior", () => {
    test("ensureUserProfile gracefully falls back to session info if database is offline", async () => {
      // Without DATABASE_URL set in test env, DB call falls back safely
      const result = await ensureUserProfile({
        userId: "user_failover_test",
        email: "failover@example.com",
        fullName: "Failover User",
      });

      assert.equal(result.user.userId, "user_failover_test");
      assert.equal(result.user.email, "failover@example.com");
      assert.equal(result.isOnboarded, false);
    });

    test("ensureUserProfile throws when userId is empty", async () => {
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

    test("checkUserOnboarded returns false when database is unavailable", async () => {
      const isOnboarded = await checkUserOnboarded("user_missing_db");
      assert.equal(isOnboarded, false);
    });
  });
});
