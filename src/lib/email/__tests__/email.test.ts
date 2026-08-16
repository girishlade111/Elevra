import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { encryptCredential, decryptCredential } from "@/lib/security/encryption";
import { maskEmail, mapSmtpError, createGmailTransporter } from "../nodemailer";
import { renderTestEmailHtml, renderTestEmailText } from "../templates/test-email";
import { renderWeeklyCheckinHtml, renderWeeklyCheckinText } from "../templates/weekly-checkin";
import {
  connectGmailSchema,
  testEmailSchema,
  updateEmailPreferencesSchema,
} from "@/lib/validation/email";
import { ResendEmailProvider } from "../resend";
import { GmailEmailProvider } from "../gmail";

// Set mock encryption key for test suite
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Email Credential Encryption (AES-256-GCM)", () => {
  test("encrypts and decrypts Gmail App Passwords correctly in roundtrip", () => {
    const rawAppPassword = "abcd efgh ijkl mnop";
    const encrypted = encryptCredential(rawAppPassword);

    assert.notEqual(encrypted, rawAppPassword);
    assert.match(encrypted, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);

    const decrypted = decryptCredential(encrypted);
    assert.equal(decrypted, rawAppPassword);
  });

  test("produces non-deterministic ciphertext with unique IVs for identical passwords", () => {
    const raw = "sample-secret-password";
    const enc1 = encryptCredential(raw);
    const enc2 = encryptCredential(raw);

    assert.notEqual(enc1, enc2);
    assert.equal(decryptCredential(enc1), raw);
    assert.equal(decryptCredential(enc2), raw);
  });

  test("rejects malformed ciphertext format", () => {
    assert.throws(() => {
      decryptCredential("invalid-ciphertext-without-colons");
    }, /Invalid ciphertext format/);
  });

  test("rejects tampered ciphertext auth tags", () => {
    const encrypted = encryptCredential("secret");
    const parts = encrypted.split(":");
    // Tamper with the ciphertext byte
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]?.slice(0, -2)}ff`;

    assert.throws(() => {
      decryptCredential(tampered);
    });
  });
});

describe("Gmail SMTP Helper & Error Mapping", () => {
  test("masks email addresses safely without leaking full username", () => {
    assert.equal(maskEmail("alex.rivera@gmail.com"), "al***@gmail.com");
    assert.equal(maskEmail("john@example.com"), "jo***@example.com");
    assert.equal(maskEmail("a@b.com"), "a***@b.com");
    assert.equal(maskEmail("invalid"), "***");
  });

  test("strips whitespace from 16-character App Passwords during transporter creation", () => {
    const transporter = createGmailTransporter("user@gmail.com", "abcd efgh ijkl mnop");
    assert.ok(transporter);
    // @ts-expect-error accessing internal auth for verification
    assert.equal(transporter.options.auth.pass, "abcdefghijklmnop");
  });

  test("maps authentication failure to user-friendly error without leaking internal details", () => {
    const badAuthErr = new Error("535-5.7.8 Username and Password not accepted.");
    const mapped = mapSmtpError(badAuthErr);

    assert.match(mapped, /Gmail authentication failed/);
    assert.match(mapped, /16-character App Password/);
    assert.doesNotMatch(mapped, /535-5.7.8/);
  });

  test("maps network timeout errors appropriately", () => {
    const timeoutErr = { code: "ETIMEDOUT", message: "Connection timed out" };
    const mapped = mapSmtpError(timeoutErr);

    assert.match(mapped, /timed out/);
  });
});

describe("Email Zod Validation Schemas", () => {
  test("validates valid Gmail credentials with 16-char App Password (with spaces)", () => {
    const valid = connectGmailSchema.safeParse({
      provider: "gmail",
      email: "user@gmail.com",
      appPassword: "abcd efgh ijkl mnop",
    });

    assert.equal(valid.success, true);
  });

  test("rejects invalid email for Gmail provider", () => {
    const invalid = connectGmailSchema.safeParse({
      provider: "gmail",
      email: "not-an-email",
      appPassword: "abcd efgh ijkl mnop",
    });

    assert.equal(invalid.success, false);
  });

  test("rejects short App Password less than 16 characters", () => {
    const invalid = connectGmailSchema.safeParse({
      provider: "gmail",
      email: "user@gmail.com",
      appPassword: "too-short",
    });

    assert.equal(invalid.success, false);
  });

  test("validates test email payload", () => {
    const valid = testEmailSchema.safeParse({
      recipientEmail: "test@example.com",
      provider: "resend",
    });

    assert.equal(valid.success, true);
  });

  test("validates update email preferences schema", () => {
    const valid = updateEmailPreferencesSchema.safeParse({
      provider: "gmail",
      weeklyCheckinsEnabled: true,
      destinationEmail: "dest@example.com",
    });

    assert.equal(valid.success, true);
  });
});

describe("Email HTML and Text Template Renderers", () => {
  test("renders test email HTML with user greeting and provider name", () => {
    const html = renderTestEmailHtml({
      userName: "Sarah",
      provider: "gmail",
      timestamp: "Mon, 16 Aug 2026 10:00:00 GMT",
    });

    assert.match(html, /Sarah/);
    assert.match(html, /GMAIL/i);
    assert.match(html, /Connection Verified/);
    assert.match(html, /Elevra/);
  });

  test("renders test email plaintext accurately", () => {
    const text = renderTestEmailText({
      userName: "Sarah",
      provider: "resend",
      timestamp: "Mon, 16 Aug 2026 10:00:00 GMT",
    });

    assert.match(text, /Hello Sarah/);
    assert.match(text, /RESEND/i);
  });

  test("renders weekly check-in HTML with micro-actions and reflection prompt", () => {
    const html = renderWeeklyCheckinHtml({
      userName: "Alex",
      subject: "Elevra Weekly Briefing: Salary Anchor Strategy",
      greeting: "Hi Alex,",
      progress_acknowledgment:
        "Identified anchoring cognitive barrier during salary negotiation and reframed boundary setting as strategic clarity.",
      weekly_challenge: "Draft 3 market anchor statements before the discussion.",
      motivational_quote: "Confidence is clarity in action.",
      closing: "Rooting for your growth,\nYour Elevra Coach",
      appUrl: "http://localhost:3000",
      monthlyGoal: "Negotiate higher compensation band",
      careerStage: "Senior Lead",
    });

    assert.match(html, /Weekly Executive Check-In/);
    assert.match(html, /Hi Alex,/);
    assert.match(html, /Draft 3 market anchor statements/);
    assert.match(html, /Confidence is clarity in action/);
  });

  test("renders weekly check-in plaintext accurately", () => {
    const text = renderWeeklyCheckinText({
      userName: "Alex",
      subject: "Elevra Weekly Briefing: Salary Anchor Strategy",
      greeting: "Hi Alex,",
      progress_acknowledgment: "Identified anchoring barrier during negotiation.",
      weekly_challenge: "Draft 3 statements.",
      motivational_quote: "Confidence is clarity in action.",
      closing: "Rooting for your growth,\nYour Elevra Coach",
      appUrl: "http://localhost:3000",
      monthlyGoal: "Negotiate higher compensation band",
    });

    assert.match(text, /ELEVRA • WEEKLY EXECUTIVE CHECK-IN/);
    assert.match(text, /Draft 3 statements/);
  });
});

describe("Email Provider Isolation & Fallback", () => {
  test("ResendEmailProvider adheres to common EmailProvider interface", () => {
    const provider = new ResendEmailProvider({ apiKey: "mock-key", fromEmail: "test@example.com" });
    assert.equal(provider.name, "resend");
    assert.equal(typeof provider.send, "function");
    assert.equal(typeof provider.testConnection, "function");
  });

  test("GmailEmailProvider adheres to common EmailProvider interface", () => {
    const provider = new GmailEmailProvider({ user: "test@gmail.com", pass: "abcdefghijklmnop" });
    assert.equal(provider.name, "gmail");
    assert.equal(typeof provider.send, "function");
    assert.equal(typeof provider.testConnection, "function");
  });
});
