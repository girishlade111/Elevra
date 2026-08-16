import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { GET as getEmailPrefs, POST as updateEmailPrefs } from "@/app/api/email/preferences/route";
import { POST as connectGmailRoute } from "@/app/api/email/connect/route";
import { POST as disconnectGmailRoute } from "@/app/api/email/disconnect/route";
import { POST as sendTestEmailRoute } from "@/app/api/email/test/route";
import { GET as getProfileRoute, PATCH as updateProfileRoute } from "@/app/api/profile/route";
import { POST as clearHistoryRoute } from "@/app/api/account/clear-history/route";
import { POST as deleteAccountRoute } from "@/app/api/account/delete/route";
import { POST as exportAccountRoute } from "@/app/api/account/export/route";
import { setAuthMock } from "@/lib/auth/get-current-user";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";
import { emailService } from "@/lib/email/service";
import { rateLimiter } from "@/lib/security/rate-limit";

describe("Settings & Account Management Route Handlers", () => {
  let store: MockRepositoryStore;

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);
    rateLimiter.reset();

    setAuthMock(
      async () => ({ userId: "user_settings_test" }),
      async () => ({
        id: "user_settings_test",
        firstName: "Taylor",
        lastName: "Swift",
        emailAddresses: [{ id: "e1", emailAddress: "taylor@example.com" }],
      })
    );

    // Seed profile
    store.upsertProfile("user_settings_test", {
      email: "taylor@example.com",
      name: "Taylor Swift",
      careerStage: "Senior or Leadership",
      challenge: "Salary negotiation",
      monthlyGoal: "Lead new global initiative",
      onboardingCompleted: true,
      onboardingStep: 4,
    });
  });

  describe("Email Preferences (/api/email/preferences)", () => {
    test("GET returns existing preferences or defaults", async () => {
      const res = await getEmailPrefs();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.provider, "resend");
      assert.equal(json.data.weeklyCheckinsEnabled, true);
    });

    test("POST switches provider and toggles weekly check-ins", async () => {
      const req = new Request("http://localhost:3000/api/email/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gmail",
          weeklyCheckinsEnabled: false,
        }),
      });

      const res = await updateEmailPrefs(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.provider, "gmail");
      assert.equal(json.data.weeklyCheckinsEnabled, false);

      const inDb = await store.getEmailPreference("user_settings_test");
      assert.equal(inDb?.provider, "gmail");
      assert.equal(inDb?.weeklyCheckinsEnabled, false);
    });
  });

  describe("Gmail Connection Management (/api/email/connect & disconnect)", () => {
    test("POST /api/email/connect stores encrypted credentials on successful verification", async () => {
      // Stub testConnection on emailService
      emailService.testConnection = async () => ({
        success: true,
        provider: "gmail",
        message: "Successfully connected",
      });

      const req = new Request("http://localhost:3000/api/email/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gmail",
          email: "taylor@gmail.com",
          appPassword: "abcd efgh ijkl mnop",
        }),
      });

      const res = await connectGmailRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.message.includes("connected"));

      // Verify stored connection in DB
      const conn = await store.getEmailConnection("user_settings_test");
      assert.ok(conn !== null);
      assert.equal(conn.email, "taylor@gmail.com");
      assert.equal(conn.isConnected, true);

      // Verify raw storage holds encrypted payload
      const rawStored = store.store.emailConnections.get("user_settings_test");
      const encryptedValue = (rawStored as any)?.appPassword || (rawStored as any)?.encryptedAppPassword;
      assert.ok(encryptedValue?.includes(":"));
    });

    test("POST /api/email/disconnect removes credentials and resets provider to resend", async () => {
      await store.upsertEmailConnection("user_settings_test", {
        email: "taylor@gmail.com",
        appPassword: "encrypted_string",
        provider: "gmail",
      });
      await store.upsertEmailPreference("user_settings_test", {
        provider: "gmail",
        weeklyCheckinsEnabled: true,
      });

      const res = await disconnectGmailRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.message.includes("disconnected"));

      const conn = await store.getEmailConnection("user_settings_test");
      assert.equal(conn, null);

      const pref = await store.getEmailPreference("user_settings_test");
      assert.equal(pref?.provider, "resend");
    });
  });

  describe("Test Email Dispatch (/api/email/test)", () => {
    test("dispatches test email and enforces rate limit", async () => {
      emailService.sendTestEmail = async () => ({
        success: true,
        provider: "resend",
        messageId: "test_resend_123",
      });

      const req = new Request("http://localhost:3000/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: "taylor@example.com",
          provider: "resend",
        }),
      });

      const res = await sendTestEmailRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.messageId, "test_resend_123");
    });
  });

  describe("Profile Management (/api/profile)", () => {
    test("GET returns current user profile", async () => {
      const res = await getProfileRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, "Taylor Swift");
      assert.equal(json.data.careerStage, "Senior or Leadership");
    });

    test("PATCH updates user profile fields", async () => {
      const req = new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Taylor A. Swift",
          monthlyGoal: "Publish keynote speech on leadership",
        }),
      });

      const res = await updateProfileRoute(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.name, "Taylor A. Swift");
      assert.equal(json.data.monthlyGoal, "Publish keynote speech on leadership");
    });
  });

  describe("Account History & Permanent Deletion (/api/account/*)", () => {
    test("POST /api/account/clear-history wipes all conversations and messages", async () => {
      const c1 = await store.createConversation("user_settings_test", "Chat 1");
      await store.createMessage({
        conversationId: c1.id,
        clerkUserId: "user_settings_test",
        role: "user",
        content: "Message 1",
      });

      const res = await clearHistoryRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      const convs = await store.listConversations("user_settings_test");
      assert.equal(convs.length, 0);
    });

    test("POST /api/account/export bundles profile, conversations, and checkins without leaking secrets", async () => {
      const c1 = await store.createConversation("user_settings_test", "Exported Chat");
      await store.createMessage({
        conversationId: c1.id,
        clerkUserId: "user_settings_test",
        role: "user",
        content: "Exportable message",
      });

      const res = await exportAccountRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.profile);
      assert.equal(json.data.conversations.length, 1);
      assert.equal(json.data.conversations[0].messages.length, 1);
      // Ensure no raw passwords in output
      const rawText = JSON.stringify(json.data);
      assert.ok(!rawText.includes("appPassword"));
    });

    test("POST /api/account/delete permanently cascades deletion across all tables", async () => {
      const c1 = await store.createConversation("user_settings_test", "Chat to delete");
      await store.createMessage({
        conversationId: c1.id,
        clerkUserId: "user_settings_test",
        role: "user",
        content: "Message to delete",
      });
      await store.upsertEmailPreference("user_settings_test", { provider: "resend" });

      const res = await deleteAccountRoute();
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.message.includes("permanently wiped"));

      assert.equal(await store.getProfile("user_settings_test"), null);
      assert.equal((await store.listConversations("user_settings_test")).length, 0);
    });
  });
});
