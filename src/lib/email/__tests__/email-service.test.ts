import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { EmailService } from "@/lib/email/service";
import { ResendEmailProvider } from "@/lib/email/resend";
import { GmailEmailProvider } from "@/lib/email/gmail";
import { MockRepositoryStore } from "@/test-utils/test-mock-db";
import { setupTestDatabase } from "@/test-utils/mock-drizzle";
import * as nodemailerModule from "@/lib/email/nodemailer";

describe("Email Services & Provider Orchestration", () => {
  let store: MockRepositoryStore;
  let service: EmailService;

  beforeEach(() => {
    store = new MockRepositoryStore();
    setupTestDatabase(store);
    service = new EmailService();
  });

  describe("Resend Email Provider", () => {
    test("handles missing RESEND_API_KEY gracefully without throwing unhandled exceptions", async () => {
      const provider = new ResendEmailProvider({ apiKey: "" });
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      const connTest = await provider.testConnection();
      assert.equal(connTest.success, false);
      assert.ok(connTest.error?.includes("Resend configuration unavailable"));

      const sendResult = await provider.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Hello</p>",
      });
      assert.equal(sendResult.success, false);
      assert.equal(sendResult.provider, "resend");
      assert.ok(sendResult.error);

      process.env.RESEND_API_KEY = originalKey;
    });

    test("formats fallback plaintext from HTML when plaintext is omitted", async () => {
      const provider = new ResendEmailProvider();
      let sentPayload: any = null;

      // Mock internal getClient
      (provider as any).getClient = () => ({
        client: {
          emails: {
            send: async (payload: any) => {
              sentPayload = payload;
              return { data: { id: "resend_msg_123" }, error: null };
            },
          },
        },
        from: "coach@elevra.ai",
      });

      const res = await provider.send({
        to: "client@example.com",
        subject: "Weekly Briefing",
        html: "<h1>Hello</h1><p>Action step</p>",
      });

      assert.equal(res.success, true);
      assert.equal(res.messageId, "resend_msg_123");
      assert.equal(sentPayload.to, "client@example.com");
      assert.ok(sentPayload.text.includes("Hello"));
    });

    test("maps API error responses safely", async () => {
      const provider = new ResendEmailProvider();
      (provider as any).getClient = () => ({
        client: {
          emails: {
            send: async () => {
              return { data: null, error: { message: "Domain not verified on Resend" } };
            },
          },
        },
        from: "coach@elevra.ai",
      });

      const res = await provider.send({
        to: "client@example.com",
        subject: "Weekly Briefing",
        html: "<p>Content</p>",
      });

      assert.equal(res.success, false);
      assert.equal(res.error, "Domain not verified on Resend");
    });
  });

  describe("Gmail SMTP Provider", () => {
    test("strips whitespace from 16-character App Passwords during transporter configuration", async () => {
      const provider = new GmailEmailProvider({
        user: "coach@gmail.com",
        pass: " abcd efgh ijkl mnop ",
      });

      let configuredPass = "";
      const originalCreate = nodemailerModule.createGmailTransporter;
      (nodemailerModule as any).createGmailTransporter = (user: string, pass: string) => {
        configuredPass = pass;
        return {
          sendMail: async () => ({ messageId: "gmail_smtp_123" }),
        } as any;
      };

      const res = await provider.send({
        to: "recipient@example.com",
        subject: "Hello from Gmail",
        html: "<p>Test</p>",
      });

      assert.equal(res.success, true);
      assert.equal(res.messageId, "gmail_smtp_123");
      // Assert whitespace was stripped
      assert.equal(configuredPass, "abcdefghijklmnop");

      (nodemailerModule as any).createGmailTransporter = originalCreate;
    });

    test("maps SMTP authentication failures (invalid app password) to clean user error", async () => {
      const provider = new GmailEmailProvider({
        user: "coach@gmail.com",
        pass: "invalidpasswordxx",
      });

      const originalCreate = nodemailerModule.createGmailTransporter;
      (nodemailerModule as any).createGmailTransporter = () => ({
        sendMail: async () => {
          const err: any = new Error("535-5.7.8 Username and Password not accepted");
          err.code = "EAUTH";
          err.responseCode = 535;
          throw err;
        },
      } as any);

      const res = await provider.send({
        to: "recipient@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes("Gmail authentication failed"));
      assert.ok(!res.error?.includes("invalidpasswordxx"), "Must not leak password in error message");

      (nodemailerModule as any).createGmailTransporter = originalCreate;
    });

    test("testConnection verifies SMTP credentials successfully", async () => {
      const provider = new GmailEmailProvider({
        user: "test@gmail.com",
        pass: "abcdefghijklmnop",
      });

      const originalVerify = nodemailerModule.verifySmtpConnection;
      (nodemailerModule as any).verifySmtpConnection = async () => ({ success: true });

      const testResult = await provider.testConnection();
      assert.equal(testResult.success, true);
      assert.equal(testResult.provider, "gmail");

      (nodemailerModule as any).verifySmtpConnection = originalVerify;
    });
  });

  describe("EmailService Orchestration & Dynamic Fallbacks", () => {
    test("resolves default Resend provider when user has no Gmail credentials configured", async () => {
      const { provider, resolvedType } = await service.resolveProvider("user_no_gmail");
      assert.equal(resolvedType, "resend");
      assert.equal(provider.name, "resend");
    });

    test("resolves Gmail provider when user has connected Gmail and preference set", async () => {
      await store.upsertEmailConnection("user_has_gmail", {
        email: "user@gmail.com",
        appPassword: "abcd efgh ijkl mnop",
        provider: "gmail",
      });
      await store.upsertEmailPreference("user_has_gmail", {
        provider: "gmail",
        weeklyCheckinsEnabled: true,
      });

      const { provider, resolvedType } = await service.resolveProvider("user_has_gmail");
      assert.equal(resolvedType, "gmail");
      assert.equal(provider.name, "gmail");
    });

    test("testConnection handles disconnected Gmail gracefully", async () => {
      const testResult = await service.testConnection("user_disconnected", "gmail");
      assert.equal(testResult.success, false);
      assert.equal(testResult.error, "No Gmail credentials connected for this account.");
    });
  });
});
