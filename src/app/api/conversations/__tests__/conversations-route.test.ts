import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GET as listConversationsRoute, POST as createConversationRoute } from "@/app/api/conversations/route";
import { GET as getConversationRoute, DELETE as deleteConversationRoute } from "@/app/api/conversations/[id]/route";
import { setAuthMock } from "@/lib/auth/get-current-user";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";

describe("Conversations Route Handlers (/api/conversations & /api/conversations/[id])", () => {
  let store: MockRepositoryStore;

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);

    setAuthMock(
      async () => ({ userId: "user_alice" }),
      async () => ({
        id: "user_alice",
        firstName: "Alice",
        emailAddresses: [{ id: "e1", emailAddress: "alice@example.com" }],
      })
    );
  });

  describe("GET /api/conversations (List Conversations)", () => {
    test("rejects unauthenticated requests with 401", async () => {
      setAuthMock(async () => ({ userId: null }), async () => null);

      const res = await listConversationsRoute();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "UNAUTHORIZED");
    });

    test("returns user's conversations and strictly isolates from other users", async () => {
      // Alice's conversation
      const c1 = await store.createConversation("user_alice", "Alice Salary Talk");
      await store.createMessage({
        conversationId: c1.id,
        clerkUserId: "user_alice",
        role: "user",
        content: "How much should I ask for?",
      });

      // Bob's conversation
      await store.createConversation("user_bob", "Bob Private Career Pivot");

      const res = await listConversationsRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.length, 1);
      assert.equal(json.data[0].id, c1.id);
      assert.equal(json.data[0].title, "Alice Salary Talk");
      assert.equal(json.data[0].messageCount, 1);
    });
  });

  describe("POST /api/conversations (Create Conversation)", () => {
    test("creates new conversation for authenticated user with custom title", async () => {
      const req = new Request("http://localhost:3000/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Leadership Preparation" }),
      });

      const res = await createConversationRoute(req);
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.clerkUserId, "user_alice");
      assert.equal(json.data.title, "Leadership Preparation");

      const inDb = await store.getConversation(json.data.id, "user_alice");
      assert.ok(inDb !== null);
    });

    test("defaults title when no title is provided in payload", async () => {
      const req = new Request("http://localhost:3000/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await createConversationRoute(req);
      assert.equal(res.status, 201);
      const json = await res.json();
      assert.equal(json.data.title, "New Coaching Session");
    });
  });

  describe("GET /api/conversations/[id] (Get Conversation & Thread)", () => {
    test("returns conversation and message thread for owner", async () => {
      const conv = await store.createConversation("user_alice", "Interview Confidence");
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_alice",
        role: "user",
        content: "I have an interview tomorrow.",
      });
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_alice",
        role: "assistant",
        content: JSON.stringify({ main_advice: "Take three deep breaths before answering." }),
        intent: "interview_prep",
      });

      const params = Promise.resolve({ id: conv.id });
      const res = await getConversationRoute(new Request("http://localhost:3000"), { params });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.conversation.id, conv.id);
      assert.equal(json.data.messages.length, 2);
      assert.equal(json.data.messages[0].role, "user");
      assert.equal(json.data.messages[1].role, "assistant");
      assert.equal(json.data.messages[1].intent, "interview_prep");
      assert.equal(
        json.data.messages[1].structured.main_advice,
        "Take three deep breaths before answering."
      );
    });

    test("returns 404 NOT_FOUND when attempting IDOR access to another user's conversation", async () => {
      // Bob owns this conversation
      const bobConv = await store.createConversation("user_bob", "Bob Secret Conversation");

      // Alice (authenticated user) attempts to access Bob's conversation
      const params = Promise.resolve({ id: bobConv.id });
      const res = await getConversationRoute(new Request("http://localhost:3000"), { params });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, "NOT_FOUND");
    });

    test("returns 404 NOT_FOUND for non-existent conversation ID", async () => {
      const params = Promise.resolve({ id: "non_existent_conv_id" });
      const res = await getConversationRoute(new Request("http://localhost:3000"), { params });

      assert.equal(res.status, 404);
    });
  });

  describe("DELETE /api/conversations/[id] (Delete Conversation)", () => {
    test("deletes owned conversation and returns 200", async () => {
      const conv = await store.createConversation("user_alice", "To Be Deleted");
      await store.createMessage({
        conversationId: conv.id,
        clerkUserId: "user_alice",
        role: "user",
        content: "Will be deleted",
      });

      const params = Promise.resolve({ id: conv.id });
      const res = await deleteConversationRoute(new Request("http://localhost:3000"), { params });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, conv.id);

      assert.equal(await store.getConversation(conv.id, "user_alice"), null);
    });

    test("returns 404 NOT_FOUND when attempting to delete another user's conversation (IDOR)", async () => {
      const bobConv = await store.createConversation("user_bob", "Bob's Permanent Chat");

      // Alice attempts to delete Bob's conversation
      const params = Promise.resolve({ id: bobConv.id });
      const res = await deleteConversationRoute(new Request("http://localhost:3000"), { params });

      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);

      // Verify Bob's conversation still exists
      const bobCheck = await store.getConversation(bobConv.id, "user_bob");
      assert.ok(bobCheck !== null);
    });
  });
});
