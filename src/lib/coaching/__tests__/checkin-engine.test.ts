import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildWeeklyCheckinPrompt,
  createFallbackCheckin,
} from "../checkin-engine";
import {
  weeklyCheckinAiOutputSchema,
  type WeeklyCheckinAiOutput,
} from "@/lib/validation/checkin";
import {
  renderWeeklyCheckinHtml,
  renderWeeklyCheckinText,
} from "@/lib/email/templates/weekly-checkin";
import { validateCronRequest } from "@/lib/security/cron-auth";
import type { Profile } from "@/db/schema/users";

const mockProfile: Profile = {
  id: "p_123",
  clerkUserId: "user_test_123",
  email: "sarah.chen@example.com",
  name: "Sarah Chen",
  careerStage: "Senior Lead",
  challenge: "Hesitating before interjecting in executive reviews",
  monthlyGoal: "Speak with conviction in Q3 strategic planning",
  onboardingStep: 3,
  onboardingCompleted: true,
  joinedAt: new Date("2026-01-01"),
  lastActiveAt: new Date("2026-08-16"),
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-08-16"),
};

describe("Weekly Check-In Cron Authorization", () => {
  test("validates authorization when matching CRON_SECRET bearer token is provided", () => {
    process.env.CRON_SECRET = "test_cron_secret_token_12345";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    assert.equal(
      validateCronRequest("Bearer test_cron_secret_token_12345"),
      true
    );
    assert.equal(
      validateCronRequest("test_cron_secret_token_12345"),
      true
    );
  });

  test("rejects unauthorized or missing bearer headers", () => {
    process.env.CRON_SECRET = "test_cron_secret_token_12345";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    assert.equal(validateCronRequest(null), false);
    assert.equal(validateCronRequest("Bearer invalid_token"), false);
    assert.equal(validateCronRequest(""), false);
  });
});

describe("Weekly Check-In Prompt Building", () => {
  test("injects real user profile attributes and recent dialogue topics", () => {
    const prompt = buildWeeklyCheckinPrompt(
      mockProfile,
      ["Salary Negotiation", "Executive Presence"],
      ["Explored boundary setting during compensation review."]
    );

    assert.match(prompt, /Sarah Chen/);
    assert.match(prompt, /Senior Lead/);
    assert.match(prompt, /Speak with conviction/);
    assert.match(prompt, /Salary Negotiation, Executive Presence/);
    assert.match(prompt, /Do NOT invent a fake quote/);
  });

  test("handles empty profile topics gracefully without errors", () => {
    const prompt = buildWeeklyCheckinPrompt(mockProfile, [], []);
    assert.match(prompt, /Sarah/);
    assert.match(prompt, /General professional development/);
  });
});

describe("Weekly Check-In AI Validation & Fallback", () => {
  test("validates structured AI output matching contract", () => {
    const sampleAiOutput: WeeklyCheckinAiOutput = {
      subject: "Elevra Weekly Briefing: Anchoring Your Q3 Goals",
      greeting: "Hi Sarah,",
      progress_acknowledgment:
        "This week, you explored assertive framing in leadership discussions.",
      weekly_challenge:
        "Speak first in your next team sync by offering a brief strategic overview.",
      motivational_quote:
        "Confidence is not the absence of doubt; it is the decision that something else is more important.",
      closing: "Rooting for your growth this week,\nYour Elevra Coach",
    };

    const parsed = weeklyCheckinAiOutputSchema.safeParse(sampleAiOutput);
    assert.equal(parsed.success, true);
  });

  test("rejects malformed structured output missing required fields", () => {
    const malformed = {
      subject: "Elevra Weekly Briefing",
      greeting: "Hi Sarah,",
      // missing progress_acknowledgment, weekly_challenge, motivational_quote, closing
    };

    const parsed = weeklyCheckinAiOutputSchema.safeParse(malformed);
    assert.equal(parsed.success, false);
  });

  test("generates high quality personalized fallback when AI model is offline", () => {
    const fallback = createFallbackCheckin(mockProfile);

    assert.match(fallback.subject, /Elevra Weekly Briefing/);
    assert.match(fallback.greeting, /Hi Sarah/);
    assert.match(fallback.progress_acknowledgment, /interjecting in executive reviews/);
    assert.match(fallback.weekly_challenge, /deliberate 2-second pause/);
    assert.ok(fallback.motivational_quote.length > 10);
  });
});

describe("Weekly Check-In Email Templates Rendering", () => {
  test("renders branded HTML email with all structured sections", () => {
    const html = renderWeeklyCheckinHtml({
      userName: "Sarah Chen",
      subject: "Elevra Weekly Briefing: Assertive Framing",
      greeting: "Hi Sarah,",
      progress_acknowledgment:
        "You maintained clarity during stressful conversations this week.",
      weekly_challenge:
        "Take a 5-minute confidence break before your executive briefing.",
      motivational_quote:
        "Courage starts with showing up and letting ourselves be seen.",
      closing: "Rooting for your growth,\nYour Elevra Coach",
      appUrl: "http://localhost:3000",
      monthlyGoal: "Speak with conviction in Q3 strategic planning",
      careerStage: "Senior Lead",
    });

    assert.match(html, /Weekly Executive Check-In/);
    assert.match(html, /Hi Sarah,/);
    assert.match(html, /Speak with conviction in Q3 strategic planning/);
    assert.match(html, /Take a 5-minute confidence break/);
    assert.match(html, /Courage starts with showing up/);
    assert.match(html, /Open Your Coaching Workspace/);
  });

  test("renders clean plaintext email for email clients without HTML support", () => {
    const text = renderWeeklyCheckinText({
      userName: "Sarah Chen",
      subject: "Elevra Weekly Briefing: Assertive Framing",
      greeting: "Hi Sarah,",
      progress_acknowledgment: "You maintained clarity during conversations.",
      weekly_challenge: "Take a 5-minute confidence break.",
      motivational_quote: "Courage starts with showing up.",
      closing: "Rooting for your growth,\nYour Elevra Coach",
      appUrl: "http://localhost:3000",
      monthlyGoal: "Speak with conviction",
    });

    assert.match(text, /ELEVRA • WEEKLY EXECUTIVE CHECK-IN/);
    assert.match(text, /THIS WEEK'S MICRO-CHALLENGE:/);
    assert.match(text, /WEEKLY REFLECTION:/);
  });
});
