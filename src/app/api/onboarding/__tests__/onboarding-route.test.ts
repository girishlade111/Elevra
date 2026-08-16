import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "@/app/api/onboarding/route";
import { setAuthMock } from "@/lib/auth/get-current-user";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";

describe("Onboarding Route Handler (/api/onboarding)", () => {
  let store: MockRepositoryStore;

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);
    setAuthMock(
      async () => ({ userId: "user_onboard_test" }),
      async () => ({
        id: "user_onboard_test",
        firstName: "Morgan",
        lastName: "Freeman",
        name: "Morgan Freeman",
        emailAddresses: [{ id: "e1", emailAddress: "morgan@example.com" }],
      })
    );
  });

  describe("Authentication Guard", () => {
    test("rejects unauthenticated GET requests with 401", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);

      const response = await GET();
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "UNAUTHORIZED");
    });

    test("rejects unauthenticated POST requests with 401", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);

      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: "Morgan" }),
      });

      const response = await POST(req);
      assert.equal(response.status, 401);
      const json = await response.json();
      assert.equal(json.success, false);
    });
  });

  describe("Step-by-Step Onboarding Flow", () => {
    test("Step 1: saves valid name and returns step 1 progress", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: "Morgan Freeman" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.step, 1);
      assert.equal(json.data.name, "Morgan Freeman");
      assert.equal(json.data.onboardingStep, 1);
      assert.equal(json.data.onboardingCompleted, false);

      const saved = await store.getProfile("user_onboard_test");
      assert.equal(saved?.name, "Morgan Freeman");
      assert.equal(saved?.onboardingStep, 1);
    });

    test("Step 1: rejects invalid name that is too short", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: "A" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });

    test("Step 2: saves valid career stage", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 2, careerStage: "Senior or Leadership" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.step, 2);
      assert.equal(json.data.careerStage, "Senior or Leadership");
      assert.equal(json.data.onboardingStep, 2);
    });

    test("Step 2: rejects invalid career stage enum", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 2, careerStage: "Astronaut" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });

    test("Step 3: saves valid primary challenge", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 3,
          challenge: "Leadership and assertiveness",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.step, 3);
      assert.equal(json.data.challenge, "Leadership and assertiveness");
      assert.equal(json.data.onboardingStep, 3);
    });

    test("Step 3: rejects challenge not in allowed list", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 3, challenge: "Invalid custom challenge" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });

    test("Step 4: saves monthly goal and completes onboarding", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 4,
          monthlyGoal: "Deliver a crisp, assertive promotion pitch to VP",
          isComplete: true,
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.step, 4);
      assert.equal(
        json.data.monthlyGoal,
        "Deliver a crisp, assertive promotion pitch to VP"
      );
      assert.equal(json.data.onboardingStep, 4);
      assert.equal(json.data.onboardingCompleted, true);

      const saved = await store.getProfile("user_onboard_test");
      assert.equal(saved?.onboardingCompleted, true);
    });
  });

  describe("Resume after Refresh & Idempotency", () => {
    test("GET returns saved onboarding state across refresh", async () => {
      await store.upsertProfile("user_onboard_test", {
        email: "morgan@example.com",
        name: "Morgan Freeman",
        careerStage: "Senior or Leadership",
        challenge: "Salary negotiation",
      });
      await store.updateOnboarding("user_onboard_test", { onboardingStep: 3 });

      const res = await GET();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, "Morgan Freeman");
      assert.equal(json.data.careerStage, "Senior or Leadership");
      assert.equal(json.data.challenge, "Salary negotiation");
      assert.equal(json.data.onboardingStep, 3);
      assert.equal(json.data.onboardingCompleted, false);
    });

    test("duplicate step submission updates safely without creating duplicate records", async () => {
      const req1 = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: "Initial Name" }),
      });
      await POST(req1);

      const req2 = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, name: "Updated Name" }),
      });
      const res2 = await POST(req2);

      assert.equal(res2.status, 200);
      const json2 = await res2.json();
      assert.equal(json2.data.name, "Updated Name");

      const allProfiles = Array.from(store.store.profiles.values()).filter(
        (p) => p.clerkUserId === "user_onboard_test"
      );
      assert.equal(allProfiles.length, 1, "Must not create duplicate profile rows");
    });
  });

  describe("Full Direct Submission", () => {
    test("submitting complete onboarding payload succeeds and completes onboarding", async () => {
      const fullPayload = {
        name: "Taylor Swift",
        careerStage: "Senior or Leadership",
        challenge: "Leadership and assertiveness",
        monthlyGoal: "Own the stage with effortless, unshakeable poise",
      };

      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, "Taylor Swift");
      assert.equal(json.data.careerStage, "Senior or Leadership");
      assert.equal(json.data.onboardingCompleted, true);
    });

    test("submitting invalid payload structure returns 400 validation error", async () => {
      const req = new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ randomField: 12345 }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });
  });
});
