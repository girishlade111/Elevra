import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";

describe("Database Repositories & Business Logic", () => {
  let store: MockRepositoryStore;

  beforeEach(() => {
    store = new MockRepositoryStore();
  });

  describe("Profile Operations", () => {
    test("creates new profile with default onboarding state", async () => {
      const profile = await store.upsertProfile("user_alpha", {
        email: "alpha@example.com",
        name: "Alpha User",
      });

      assert.equal(profile.clerkUserId, "user_alpha");
      assert.equal(profile.email, "alpha@example.com");
      assert.equal(profile.name, "Alpha User");
      assert.equal(profile.onboardingStep, 0);
      assert.equal(profile.onboardingCompleted, false);
      assert.ok(profile.id.length > 0);
    });

    test("updates existing profile attributes without losing unchanged fields", async () => {
      await store.upsertProfile("user_alpha", {
        email: "alpha@example.com",
        name: "Alpha Original",
        careerStage: "Senior / Staff",
      });

      const updated = await store.upsertProfile("user_alpha", {
        email: "alpha.new@example.com",
        monthlyGoal: "Speak with authority in executive meetings",
      });

      assert.equal(updated.email, "alpha.new@example.com");
      assert.equal(updated.name, "Alpha Original");
      assert.equal(updated.careerStage, "Senior / Staff");
      assert.equal(updated.monthlyGoal, "Speak with authority in executive meetings");
    });

    test("updates step-by-step onboarding progress", async () => {
      await store.upsertProfile("user_onboard", { email: "onboard@example.com" });

      const step1 = await store.updateOnboarding("user_onboard", {
        name: "Jordan Doe",
        onboardingStep: 1,
      });
      assert.equal(step1?.name, "Jordan Doe");
      assert.equal(step1?.onboardingStep, 1);
      assert.equal(step1?.onboardingCompleted, false);

      const step4 = await store.updateOnboarding("user_onboard", {
        monthlyGoal: "Master salary negotiation and promo pitch",
        onboardingStep: 4,
        onboardingCompleted: true,
      });
      assert.equal(step4?.onboardingStep, 4);
      assert.equal(step4?.onboardingCompleted, true);
    });

    test("listOnboardedProfiles returns only users with onboardingCompleted = true", async () => {
      await store.upsertProfile("user_incomplete", { email: "inc@example.com" });
      await store.upsertProfile("user_completed_1", { email: "comp1@example.com" });
      await store.updateOnboarding("user_completed_1", { onboardingCompleted: true, onboardingStep: 4 });
      await store.upsertProfile("user_completed_2", { email: "comp2@example.com" });
      await store.updateOnboarding("user_completed_2", { onboardingCompleted: true, onboardingStep: 4 });

      const list = await store.listOnboardedProfiles();
      assert.equal(list.length, 2);
      assert.ok(list.every((p) => p.onboardingCompleted));
    });

    test("deleteProfile removes profile permanently", async () => {
      await store.upsertProfile("user_delete_me", { email: "del@example.com" });
      assert.ok((await store.getProfile("user_delete_me")) !== null);

      await store.deleteProfile("user_delete_me");
      assert.equal(await store.getProfile("user_delete_me"), null);
    });
  });

  describe("Conversation & Message Operations", () => {
    test("creates conversation container and retrieves by owner", async () => {
      const conv = await store.createConversation("user_owner", "Salary Strategy Session");
      assert.equal(conv.clerkUserId, "user_owner");
      assert.equal(conv.title, "Salary Strategy Session");

      const fetched = await store.getConversation(conv.id, "user_owner");
      assert.ok(fetched !== null);
      assert.equal(fetched.id, conv.id);
    });

    test("inserts messages for user and assistant with intent tagging", async () => {
      const conv = await store.createConversation("user_chat", "Interview Prep");

      const userMsg = await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_chat",
        role: "user",
        content: "How do I answer tell me about a time you failed?",
      });

      const assistantMsg = await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_chat",
        role: "assistant",
        content: JSON.stringify({ main_advice: "Frame failure through structured resilience." }),
        intent: "interview_prep",
      });

      const messages = await store.getMessages(conv.id, "user_chat");
      assert.equal(messages.length, 2);
      assert.equal(messages[0].id, userMsg.id);
      assert.equal(messages[1].id, assistantMsg.id);
      assert.equal(messages[1].intent, "interview_prep");
    });

    test("getRecentMessages bounds history to requested limit", async () => {
      const conv = await store.createConversation("user_limit", "History Test");
      for (let i = 1; i <= 15; i++) {
        await store.createMessage({
          conversationId: conv.id,
          clerkUserId: "user_limit",
          role: i % 2 === 1 ? "user" : "assistant",
          content: `Message ${i}`,
        });
      }

      const recent = await store.getRecentMessages(conv.id, "user_limit", 10);
      assert.equal(recent.length, 10);
    });

    test("deleteConversation removes conversation and cascades message cleanup", async () => {
      const conv = await store.createConversation("user_cascade", "Delete Test");
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_cascade",
        role: "user",
        content: "Message before delete",
      });

      const deleted = await store.deleteConversation(conv.id, "user_cascade");
      assert.equal(deleted, true);

      assert.equal(await store.getConversation(conv.id, "user_cascade"), null);
      const remainingMsgs = await store.getMessages(conv.id, "user_cascade");
      assert.equal(remainingMsgs.length, 0);
    });

    test("clearAllConversations removes all user conversations and messages", async () => {
      const c1 = await store.createConversation("user_wipe", "Conv 1");
      const c2 = await store.createConversation("user_wipe", "Conv 2");
      await store.createMessage({ conversationId: c1.id, clerkUserId: "user_wipe", role: "user", content: "Hi" });
      await store.createMessage({ conversationId: c2.id, clerkUserId: "user_wipe", role: "user", content: "Hello" });

      await store.clearAllConversations("user_wipe");

      const remaining = await store.listConversations("user_wipe");
      assert.equal(remaining.length, 0);
      assert.equal((await store.getMessages(c1.id, "user_wipe")).length, 0);
    });
  });

  describe("User Isolation & Multi-Tenant Boundaries", () => {
    test("User B cannot access User A's conversation (IDOR Prevention)", async () => {
      const convA = await store.createConversation("user_alice", "Alice Confidential Notes");

      // Bob tries to get Alice's conversation
      const bobAccess = await store.getConversation(convA.id, "user_bob");
      assert.equal(bobAccess, null, "Bob must not be able to retrieve Alice's conversation");

      // Bob tries to list messages from Alice's conversation
      const bobMessages = await store.getMessages(convA.id, "user_bob");
      assert.equal(bobMessages.length, 0, "Bob must not be able to view Alice's messages");

      // Bob tries to delete Alice's conversation
      const bobDelete = await store.deleteConversation(convA.id, "user_bob");
      assert.equal(bobDelete, false, "Bob must not be able to delete Alice's conversation");

      // Ensure Alice's conversation is untouched
      const aliceCheck = await store.getConversation(convA.id, "user_alice");
      assert.ok(aliceCheck !== null);
    });

    test("listConversations strictly scopes results by clerkUserId", async () => {
      await store.createConversation("user_alice", "Alice 1");
      await store.createConversation("user_alice", "Alice 2");
      await store.createConversation("user_bob", "Bob 1");

      const aliceList = await store.listConversations("user_alice");
      const bobList = await store.listConversations("user_bob");

      assert.equal(aliceList.length, 2);
      assert.equal(bobList.length, 1);
      assert.ok(aliceList.every((c) => c.clerkUserId === "user_alice"));
      assert.ok(bobList.every((c) => c.clerkUserId === "user_bob"));
    });
  });

  describe("Email Connections & AES-256 Encryption", () => {
    test("encrypts Gmail app password in storage and decrypts cleanly for owner", async () => {
      const rawPassword = "abcd efgh ijkl mnop";
      const conn = await store.upsertEmailConnection("user_mail", {
        email: "mail@gmail.com",
        appPassword: rawPassword,
        provider: "gmail",
      });

      // Storage has encrypted payload in iv:authTag:ciphertext format, not raw password
      assert.ok(conn.encryptedAppPassword.length > 0);
      assert.notEqual(conn.encryptedAppPassword, rawPassword);
      assert.equal(conn.encryptedAppPassword.split(":").length, 3);

      // Decrypted retrieve
      const decrypted = await store.getEmailConnectionWithCredentials("user_mail");
      assert.ok(decrypted !== null);
      assert.equal(decrypted.appPassword, rawPassword);
    });

    test("deleteEmailConnection wipes credentials from database", async () => {
      await store.upsertEmailConnection("user_wipe_mail", {
        email: "wipe@gmail.com",
        appPassword: "xxxx yyyy zzzz wwww",
      });

      await store.deleteEmailConnection("user_wipe_mail");
      assert.equal(await store.getEmailConnection("user_wipe_mail"), null);
    });
  });

  describe("Weekly Check-ins & Idempotency", () => {
    test("creates checkin record and updates status with messageId", async () => {
      const checkin = await store.createCheckin({
        clerkUserId: "user_chk",
        provider: "resend",
        recipientEmail: "chk@example.com",
        subject: "Elevra Weekly Briefing",
        content: "Checkin text",
      });

      assert.equal(checkin.status, "pending");

      const updated = await store.updateCheckinStatus(checkin.id, "sent", "msg_resend_999");
      assert.equal(updated?.status, "sent");
      assert.equal(updated?.messageId, "msg_resend_999");
      assert.ok(updated?.sentAt !== null);
    });

    test("hasCheckinInWindow detects checkins within 6-day window", async () => {
      await store.createCheckin({
        clerkUserId: "user_window",
        provider: "resend",
        recipientEmail: "w@example.com",
        subject: "Test",
        content: "Content",
        status: "sent",
      });

      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const hasRecent = await store.hasCheckinInWindow("user_window", sixDaysAgo);
      assert.equal(hasRecent, true);

      const otherUserHasRecent = await store.hasCheckinInWindow("user_other", sixDaysAgo);
      assert.equal(otherUserHasRecent, false);
    });
  });

  describe("AI Usage & Memory Tracking", () => {
    test("records token usage and calculates summary per user", async () => {
      await store.recordUsage({
        clerkUserId: "user_usage",
        endpointType: "coaching",
        model: "meta/llama-3.1-70b-instruct",
        inputTokens: 150,
        outputTokens: 250,
      });

      await store.recordUsage({
        clerkUserId: "user_usage",
        endpointType: "coaching",
        model: "meta/llama-3.1-70b-instruct",
        inputTokens: 200,
        outputTokens: 300,
      });

      const summary = await store.getUsageSummary("user_usage");
      assert.equal(summary.totalRequests, 2);
      assert.equal(summary.totalPromptTokens, 350);
      assert.equal(summary.totalCompletionTokens, 550);
      assert.equal(summary.totalTokens, 900);
    });

    test("upserts and retrieves long-term coaching memory", async () => {
      await store.upsertMemory("user_mem", "Prefers direct feedback on salary negotiations.");
      const mem = await store.getMemory("user_mem");
      assert.ok(mem !== null);
      assert.equal(mem.summary, "Prefers direct feedback on salary negotiations.");
    });
  });
});
