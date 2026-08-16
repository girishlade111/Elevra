import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "@/app/api/chat/route";
import { setAuthMock } from "@/lib/auth/get-current-user";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";
import { nvidiaNIMProvider } from "@/lib/ai/nvidia-nim";
import { rateLimiter, RATE_LIMIT_TIERS } from "@/lib/security/rate-limit";
import {
  AIRateLimitError,
  AITimeoutError,
  AIValidationError,
  AIServerError,
} from "@/lib/ai/errors";
import type { CoachingGenerationResult } from "@/lib/ai/provider";

describe("Chat Route Handler (/api/chat)", () => {
  let store: MockRepositoryStore;

  const mockSuccessfulCoachingResult: CoachingGenerationResult = {
    response: {
      intent_detected: "salary_negotiation",
      main_advice: "Anchor your ask high with clear value metrics from your recent wins.",
      actionable_steps: [
        "1. Document quantifiable impact delivered in the last 12 months.",
        "2. Practice the counter-offer script without apologizing.",
      ],
      cognitive_reframes: [
        "Advocating for fair market compensation is professional self-respect.",
      ],
      practice_scenario: "Roleplay: 'Based on the increased scope, I am targeting $180k.'",
      follow_up_questions: ["What is your ideal base salary vs bonus target?"],
    },
    rawOutput: JSON.stringify({ main_advice: "Anchor your ask high" }),
    usage: {
      model: "meta/llama-3.1-70b-instruct",
      inputTokens: 120,
      outputTokens: 240,
      totalTokens: 360,
    },
    intent: "salary_negotiation",
    latencyMs: 350,
  };

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);
    rateLimiter.reset();

    // Default authenticated & onboarded user
    setAuthMock(
      async () => ({ userId: "user_chat_test" }),
      async () => ({
        id: "user_chat_test",
        firstName: "Alex",
        lastName: "Morgan",
        name: "Alex Morgan",
        emailAddresses: [{ id: "e1", emailAddress: "alex@example.com" }],
      })
    );

    // Setup onboarded profile
    store.upsertProfile("user_chat_test", {
      email: "alex@example.com",
      name: "Alex Morgan",
      careerStage: "Senior or Leadership",
      challenge: "Salary negotiation",
      monthlyGoal: "Negotiate a 20% base increase in upcoming review",
      onboardingCompleted: true,
      onboardingStep: 4,
    });

    // Reset provider stub
    nvidiaNIMProvider.generateCoaching = async () => mockSuccessfulCoachingResult;
  });

  describe("Authentication & Onboarding Authorization", () => {
    test("rejects unauthenticated requests with 401", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "How do I negotiate my salary?" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "UNAUTHORIZED");
    });

    test("rejects users with incomplete onboarding with 403 ONBOARDING_INCOMPLETE", async () => {
      await store.upsertProfile("user_chat_test", {
        email: "alex@example.com",
        onboardingCompleted: false,
        onboardingStep: 2,
      });

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "How do I negotiate my salary?" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "ONBOARDING_INCOMPLETE");
    });
  });

  describe("Payload Validation & Rate Limiting", () => {
    test("rejects empty or whitespace-only messages with 400 VALIDATION_ERROR", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "    " }),
      });

      const res = await POST(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "VALIDATION_ERROR");
    });

    test("enforces sliding-window rate limit when requests exceed quota", async () => {
      // Send 20 requests to hit quota limit
      for (let i = 0; i < 20; i++) {
        rateLimiter.check("chat:user_chat_test", RATE_LIMIT_TIERS.CHAT);
      }

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Rapid message" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 429);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "RATE_LIMIT_EXCEEDED");
    });
  });

  describe("Conversation Creation & Context Management", () => {
    test("creates new conversation automatically when no conversationId is supplied", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "How do I ask for a 20% salary increase?" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.conversationId);
      assert.equal(json.data.intent, "salary_negotiation");
      assert.equal(json.data.response.main_advice, mockSuccessfulCoachingResult.response.main_advice);

      // Verify conversation and message saved in DB
      const conv = await store.getConversation(json.data.conversationId, "user_chat_test");
      assert.ok(conv !== null);
      const msgs = await store.getMessages(json.data.conversationId, "user_chat_test");
      assert.equal(msgs.length, 2); // 1 user + 1 assistant
      assert.equal(msgs[0].role, "user");
      assert.equal(msgs[1].role, "assistant");
    });

    test("appends message to existing conversation when valid conversationId is provided", async () => {
      const conv = await store.createConversation("user_chat_test", "Ongoing Strategy");
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_chat_test",
        role: "user",
        content: "First turn question",
      });
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_chat_test",
        role: "assistant",
        content: JSON.stringify({ main_advice: "First turn response" }),
      });

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conv.id,
          message: "What if they push back on the bonus component?",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.conversationId, conv.id);

      const msgs = await store.getMessages(conv.id, "user_chat_test");
      assert.equal(msgs.length, 4); // 2 previous + 2 new
    });

    test("isolates conversations: User A cannot post to User B's conversation", async () => {
      // Create conversation owned by User Bob
      const bobConv = await store.createConversation("user_bob", "Bob Private Chat");

      // User Alex tries to post to Bob's conversationId
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: bobConv.id,
          message: "Attempting IDOR message injection",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const json = await res.json();

      // Safe behavior: system detects conversation is not owned by Alex, creates a new one for Alex
      assert.notEqual(json.data.conversationId, bobConv.id);

      // Verify Bob's conversation has 0 messages from Alex
      const bobMsgs = await store.getMessages(bobConv.id, "user_bob");
      assert.equal(bobMsgs.length, 0);
    });

    test("bounds historical context to 5 exchanges (10 messages max)", async () => {
      let passedMessagesCount = 0;
      nvidiaNIMProvider.generateCoaching = async (params) => {
        passedMessagesCount = params.context.recentMessages?.length || 0;
        return mockSuccessfulCoachingResult;
      };

      const conv = await store.createConversation("user_chat_test", "Long Conversation");
      for (let i = 1; i <= 14; i++) {
        await store.createMessage({
          conversationId: conv.id,
          clerkUserId: "user_chat_test",
          role: i % 2 === 1 ? "user" : "assistant",
          content: `Historical message ${i}`,
        });
      }

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conv.id,
          message: "Latest follow up question",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      assert.ok(passedMessagesCount <= 10, `History passed (${passedMessagesCount}) must not exceed 10 messages`);
    });
  });

  describe("NVIDIA NIM Error Handling & Resiliency", () => {
    test("handles NIM Rate Limit (429) error gracefully", async () => {
      nvidiaNIMProvider.generateCoaching = async () => {
        throw new AIRateLimitError("NVIDIA NIM upstream rate limit exceeded");
      };

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test 429 error" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 429);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "AI_RATE_LIMIT_ERROR");
    });

    test("handles NIM Timeout error gracefully", async () => {
      nvidiaNIMProvider.generateCoaching = async () => {
        throw new AITimeoutError("NVIDIA NIM request timed out after 25000ms");
      };

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test timeout error" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 504);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "AI_TIMEOUT_ERROR");
    });

    test("handles NIM Server / Upstream Error (500/502/503) gracefully", async () => {
      nvidiaNIMProvider.generateCoaching = async () => {
        throw new AIServerError("NVIDIA NIM internal engine error");
      };

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test server error" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 502);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "AI_SERVER_ERROR");
    });

    test("handles Malformed NIM JSON Output with validation error", async () => {
      nvidiaNIMProvider.generateCoaching = async () => {
        throw new AIValidationError("Missing required field 'main_advice' in model output");
      };

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test malformed output" }),
      });

      const res = await POST(req);
      assert.equal(res.status, 422);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "AI_VALIDATION_ERROR");
    });
  });
});
