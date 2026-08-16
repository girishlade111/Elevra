import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GET as runCronRoute } from "@/app/api/cron/weekly-checkin/route";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";
import { emailService } from "@/lib/email/service";
import { aiClient } from "@/lib/ai/client";

describe("Weekly Check-in Cron & Delivery Resiliency (/api/cron/weekly-checkin)", () => {
  let store: MockRepositoryStore;
  const originalCronSecret = process.env.CRON_SECRET;
  const TEST_SECRET = "super_secret_cron_key_123";

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);
    process.env.CRON_SECRET = TEST_SECRET;

    // Mock aiClient chatStructured output
    aiClient.chatStructured = async () => ({
      subject: "Your Weekly Growth Briefing: Strategic Alignment",
      greeting: "Hello, champion!",
      progress_acknowledgment: "You showed great resilience in your discussions.",
      weekly_challenge: "Take 5 minutes before your next meeting to set an explicit intention.",
      motivational_quote: "Clarity breeds confidence.",
      closing: "Rooting for your continued ascent, Elevra Coach.",
    } as any);

    // Mock emailService resolveProvider & send
    emailService.resolveProvider = async (userId: string) => {
      const pref = await store.getEmailPreference(userId);
      if (pref?.provider === "gmail") {
        return {
          provider: {
            name: "gmail" as const,
            send: async () => ({ success: true, messageId: "gmail_cron_msg_1", provider: "gmail" as const }),
            testConnection: async () => ({ success: true }),
          },
          resolvedType: "gmail" as const,
        };
      }
      return {
        provider: {
          name: "resend" as const,
          send: async () => ({ success: true, messageId: "resend_cron_msg_1", provider: "resend" as const }),
          testConnection: async () => ({ success: true }),
        },
        resolvedType: "resend" as const,
      };
    };
  });

  describe("Authorization & Security Guards", () => {
    test("rejects requests with missing Authorization header with 401 UNAUTHORIZED_CRON", async () => {
      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "UNAUTHORIZED_CRON");
    });

    test("rejects requests with invalid Bearer token", async () => {
      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid_secret_token",
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 401);
    });

    test("authorizes requests with matching Bearer token", async () => {
      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.job.includes("weekly_checkin"));
    });
  });

  describe("Batch Processing & Provider Orchestration", () => {
    test("processes multiple onboarded users with mixed providers (Resend + Gmail)", async () => {
      // User 1: Resend provider
      await store.upsertProfile("user_alpha", {
        email: "alpha@example.com",
        name: "Alpha User",
        careerStage: "Senior or Leadership",
        challenge: "Salary negotiation",
        monthlyGoal: "Win executive promotion",
        onboardingCompleted: true,
        onboardingStep: 4,
      });
      await store.upsertEmailPreference("user_alpha", {
        provider: "resend",
        weeklyCheckinsEnabled: true,
      });

      // User 2: Gmail provider
      await store.upsertProfile("user_beta", {
        email: "beta@gmail.com",
        name: "Beta User",
        careerStage: "Mid Career (4-8 years)",
        challenge: "Interview confidence",
        monthlyGoal: "Master behavioral interview stories",
        onboardingCompleted: true,
        onboardingStep: 4,
      });
      await store.upsertEmailPreference("user_beta", {
        provider: "gmail",
        weeklyCheckinsEnabled: true,
      });

      // User 3: Incomplete onboarding (should be ignored)
      await store.upsertProfile("user_gamma", {
        email: "gamma@example.com",
        onboardingCompleted: false,
        onboardingStep: 2,
      });

      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.totalEligible, 2);
      assert.equal(json.data.sentCount, 2);
      assert.equal(json.data.results.length, 2);

      const alphaResult = json.data.results.find((r: any) => r.userId === "user_alpha");
      const betaResult = json.data.results.find((r: any) => r.userId === "user_beta");

      assert.equal(alphaResult.provider, "resend");
      assert.equal(alphaResult.status, "sent");
      assert.equal(betaResult.provider, "gmail");
      assert.equal(betaResult.status, "sent");
    });
  });

  describe("Duplicate Prevention & Idempotency", () => {
    test("skips check-in if user was already sent a check-in within the 6-day window", async () => {
      await store.upsertProfile("user_idempotent", {
        email: "idempotent@example.com",
        name: "Idempotent User",
        careerStage: "Senior or Leadership",
        challenge: "Leadership and assertiveness",
        monthlyGoal: "Lead team meeting assertively",
        onboardingCompleted: true,
        onboardingStep: 4,
      });
      await store.upsertEmailPreference("user_idempotent", {
        provider: "resend",
        weeklyCheckinsEnabled: true,
      });

      // Record checkin sent 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const chk = await store.createCheckin({
        clerkUserId: "user_idempotent",
        provider: "resend",
        recipientEmail: "idempotent@example.com",
        subject: "Recent Checkin",
        content: "Content",
        status: "sent",
      });
      chk.createdAt = twoDaysAgo;
      chk.sentAt = twoDaysAgo;

      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.skippedCount, 1);
      assert.equal(json.data.sentCount, 0);

      const skipped = json.data.results.find((r: any) => r.userId === "user_idempotent");
      assert.equal(skipped.status, "skipped");
    });
  });

  describe("Resiliency: Partial Failure & Fallback Handling", () => {
    test("recovers from NIM generation errors using fallback synthesis without aborting", async () => {
      await store.upsertProfile("user_nim_fail", {
        email: "nim_fail@example.com",
        name: "Resilient User",
        careerStage: "Senior or Leadership",
        challenge: "Career change or pivot",
        monthlyGoal: "Transition to Product Lead",
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      // AI client throws error
      aiClient.chatStructured = async () => {
        throw new Error("NVIDIA NIM temporary upstream 503");
      };

      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      // Should still succeed using fallback synthesis
      assert.equal(json.data.sentCount, 1);
      assert.equal(json.data.failedCount, 0);
    });

    test("handles partial email failure across batch without crashing the overall cron run", async () => {
      // User 1 will fail email dispatch
      await store.upsertProfile("user_fail_email", {
        email: "fail@example.com",
        name: "Fail Email",
        careerStage: "Early Career (1-3 years)",
        challenge: "Work-life balance",
        monthlyGoal: "Log off by 6pm",
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      // User 2 will succeed email dispatch
      await store.upsertProfile("user_success_email", {
        email: "success@example.com",
        name: "Success Email",
        careerStage: "Senior or Leadership",
        challenge: "Leadership and assertiveness",
        monthlyGoal: "Present at all-hands",
        onboardingCompleted: true,
        onboardingStep: 4,
      });

      emailService.resolveProvider = async (userId: string) => {
        if (userId === "user_fail_email") {
          return {
            provider: {
              name: "resend" as const,
              send: async () => ({ success: false, error: "SMTP timeout or invalid recipient domain", provider: "resend" as const }),
              testConnection: async () => ({ success: true }),
            },
            resolvedType: "resend" as const,
          };
        }
        return {
          provider: {
            name: "resend" as const,
            send: async () => ({ success: true, messageId: "resend_ok_123", provider: "resend" as const }),
            testConnection: async () => ({ success: true }),
          },
          resolvedType: "resend" as const,
        };
      };

      const req = new Request("http://localhost:3000/api/cron/weekly-checkin", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TEST_SECRET}`,
        },
      });

      const res = await runCronRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.sentCount, 1);
      assert.equal(json.data.failedCount, 1);

      const failedResult = json.data.results.find((r: any) => r.userId === "user_fail_email");
      const successResult = json.data.results.find((r: any) => r.userId === "user_success_email");

      assert.equal(failedResult.status, "failed");
      assert.ok(failedResult.error?.includes("SMTP timeout"));
      assert.equal(successResult.status, "sent");
    });
  });
});
