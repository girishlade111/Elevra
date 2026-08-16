/**
 * @fileoverview Weekly Personalized Check-In Engine.
 * Synthesizes user conversations, goals, and challenges into structured
 * AI-generated check-in digests and dispatches via Resend or Gmail SMTP.
 * @server-only
 */
import { aiClient } from "@/lib/ai/client";
import { emailService } from "@/lib/email/service";
import {
  renderWeeklyCheckinHtml,
  renderWeeklyCheckinText,
  type WeeklyCheckinEmailData,
} from "@/lib/email/templates";
import {
  createCheckin,
  updateCheckinStatus,
  hasCheckinInWindow,
} from "@/db/repositories/weekly-checkin.repository";
import { listOnboardedProfiles, getProfile } from "@/db/repositories/profile.repository";
import { getEmailPreference } from "@/db/repositories/email-preference.repository";
import { listConversationsWithDetails } from "@/db/repositories/conversation.repository";
import { weeklyCheckinAiOutputSchema, type WeeklyCheckinAiOutput } from "@/lib/validation/checkin";
import type { Profile } from "@/db/schema/users";
import { maskEmail } from "@/lib/email/nodemailer";
import { clientEnv } from "@/config/env";
import { sanitizeForPrompt } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProcessCheckinResult {
  userId: string;
  recipientEmail: string;
  provider: "resend" | "gmail";
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  error?: string;
  errorCategory?: string;
  subject?: string;
}

export interface WeeklyCheckinCronSummary {
  job: string;
  timestamp: string;
  totalEligible: number;
  processedCount: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  results: ProcessCheckinResult[];
}

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

export function buildWeeklyCheckinPrompt(
  profile: Profile,
  recentTopics: string[],
  recentSnippets: string[]
): string {
  const userName = sanitizeForPrompt(profile.name || "Client");
  const careerStage = sanitizeForPrompt(profile.careerStage || "Professional");
  const monthlyGoal = sanitizeForPrompt(profile.monthlyGoal || "Strengthen executive confidence and communication");
  const challenge = sanitizeForPrompt(profile.challenge || "Overcoming hesitation and speaking up with clarity");

  const topicsSummary =
    recentTopics.length > 0
      ? sanitizeForPrompt(recentTopics.join(", "))
      : "General professional development and assertive communication";

  const activityContext =
    recentSnippets.length > 0
      ? recentSnippets.slice(0, 3).map((s, i) => `Session ${i + 1}: ${sanitizeForPrompt(s)}`).join("\n")
      : "Pursuing active monthly goal without recent direct chat messages.";

  return `You are Elevra's dedicated AI Executive Confidence Coach.
Generate an encouraging, personalized weekly coaching check-in synthesis for this client.

CLIENT PROFILE:
- Name: ${userName}
- Career Stage: ${careerStage}
- Primary Challenge: ${challenge}
- Current Monthly Goal: ${monthlyGoal}
- Recent Topics Engaged: ${topicsSummary}

RECENT ACTIVITY SNIPPETS:
${activityContext}

STRICT INSTRUCTIONS:
1. Tone: Warm, empowering, concise, and grounded in cognitive behavioral coaching principles.
2. Address the user directly using their first name (${userName.split(" ")[0]}).
3. Acknowledge real progress on their specific challenge without fabricating imaginary events.
4. "weekly_challenge": Provide one concrete, actionable, low-friction micro-challenge for the upcoming week (taking <= 5 minutes).
5. "motivational_quote": Provide an original, high-impact motivational reflection sentence. Do NOT invent a fake quote or falsely attribute it to a real historical person.
6. Return a valid JSON object matching this EXACT schema:
{
  "subject": "Elevra Weekly Briefing: [Short personalized focus hook]",
  "greeting": "Hi ${userName.split(" ")[0]},",
  "progress_acknowledgment": "2-3 sentences reflecting on their current trajectory, challenge, and focus areas.",
  "weekly_challenge": "1 clear, actionable micro-experiment to practice this week.",
  "motivational_quote": "1 original, empowering philosophical reflection on confidence and courage.",
  "closing": "Rooting for your growth this week,\\nYour Elevra Coach"
}`;
}

// ---------------------------------------------------------------------------
// Fallback Generator
// ---------------------------------------------------------------------------

export function createFallbackCheckin(profile: Profile): WeeklyCheckinAiOutput {
  const firstName = profile.name?.split(" ")[0] || "there";
  const challenge = profile.challenge || "executive presence";
  const goal = profile.monthlyGoal || "confidence and clarity";

  return {
    subject: `Elevra Weekly Briefing: Momentum Toward Your ${goal.slice(0, 30)} Goal`,
    greeting: `Hi ${firstName},`,
    progress_acknowledgment: `As you work through ${challenge}, remember that sustainable confidence develops through consistent micro-actions. Continuing to prioritize your monthly focus on "${goal}" builds compounding clarity.`,
    weekly_challenge: `In your next key conversation, take a deliberate 2-second pause before answering to ground your response with conviction.`,
    motivational_quote: `Confidence is not the absence of uncertainty; it is the willingness to act in the presence of it.`,
    closing: `Rooting for your growth this week,\nYour Elevra Coach`,
  };
}

// ---------------------------------------------------------------------------
// Single User Check-In Processor
// ---------------------------------------------------------------------------

export async function processWeeklyCheckinForProfile(
  profile: Profile,
  options?: { appUrl?: string; force?: boolean }
): Promise<ProcessCheckinResult> {
  const userId = profile.clerkUserId;
  const appUrl = options?.appUrl || clientEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // 1. Resolve destination email & user preferences
  const emailPref = await getEmailPreference(userId);
  const recipientEmail = emailPref?.destinationEmail || profile.email;
  const isEnabled = emailPref?.weeklyCheckinsEnabled ?? true;

  if (!isEnabled && !options?.force) {
    return {
      userId,
      recipientEmail,
      provider: "resend",
      status: "skipped",
      error: "Weekly check-ins disabled in user preferences",
    };
  }

  // 2. Idempotency Check: 6-day window check
  if (!options?.force) {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const alreadySent = await hasCheckinInWindow(userId, sixDaysAgo);
    if (alreadySent) {
      return {
        userId,
        recipientEmail,
        provider: (emailPref?.provider as "resend" | "gmail") || "resend",
        status: "skipped",
        error: "Check-in already sent or pending for this weekly window",
      };
    }
  }

  // 3. Load recent conversations & intents
  const recentConvs = await listConversationsWithDetails(userId, 3);
  const recentTopics: string[] = [];
  const recentSnippets: string[] = [];

  for (const conv of recentConvs) {
    if (conv.lastIntent) recentTopics.push(conv.lastIntent.replace(/_/g, " "));
    if (conv.lastMessagePreview) recentSnippets.push(conv.lastMessagePreview);
  }

  // 4. Generate structured content with NVIDIA NIM (with 1 retry)
  const prompt = buildWeeklyCheckinPrompt(profile, recentTopics, recentSnippets);
  let aiOutput: WeeklyCheckinAiOutput;

  try {
    const completion = await aiClient.generateCoachingResponse({
      messages: [{ role: "user", content: prompt }],
      responseFormatJson: true,
      maxTokens: 1000,
      temperature: 0.6,
    });

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(completion.rawText);
    } catch {
      // Extract from markdown codeblock if needed
      const match = completion.rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      rawJson = JSON.parse(match ? match[1] || "{}" : "{}");
    }

    const validated = weeklyCheckinAiOutputSchema.safeParse(rawJson);
    if (validated.success) {
      aiOutput = validated.data;
    } else {
      console.warn(`[WeeklyCheckin] Validation warning for ${userId}: falling back to profile synthesis.`);
      aiOutput = createFallbackCheckin(profile);
    }
  } catch (nimErr) {
    console.error(`[WeeklyCheckin] NIM generation failed for ${userId}:`, nimErr);
    aiOutput = createFallbackCheckin(profile);
  }

  // 5. Render HTML & Text Templates
  const emailData: WeeklyCheckinEmailData = {
    userName: profile.name || "Client",
    subject: aiOutput.subject,
    greeting: aiOutput.greeting,
    progress_acknowledgment: aiOutput.progress_acknowledgment,
    weekly_challenge: aiOutput.weekly_challenge,
    motivational_quote: aiOutput.motivational_quote,
    closing: aiOutput.closing,
    appUrl,
    monthlyGoal: profile.monthlyGoal,
    careerStage: profile.careerStage,
  };

  const emailHtml = renderWeeklyCheckinHtml(emailData);
  const emailText = renderWeeklyCheckinText(emailData);

  // 6. Resolve Provider & Record Initial Pending State
  const { provider, resolvedType } = await emailService.resolveProvider(userId);

  const checkinRecord = await createCheckin({
    clerkUserId: userId,
    provider: resolvedType,
    recipientEmail,
    subject: aiOutput.subject,
    content: emailText,
    status: "pending",
  });

  // 7. Dispatch Email
  const sendResult = await provider.send({
    to: recipientEmail,
    subject: aiOutput.subject,
    html: emailHtml,
    text: emailText,
  });

  // 8. Update DB Record
  await updateCheckinStatus(
    checkinRecord.id,
    sendResult.success ? "sent" : "failed",
    sendResult.messageId || null,
    sendResult.error || null
  );

  return {
    userId,
    recipientEmail,
    provider: resolvedType,
    status: sendResult.success ? "sent" : "failed",
    messageId: sendResult.messageId,
    error: sendResult.error,
    errorCategory: sendResult.success ? undefined : "DELIVERY_ERROR",
    subject: aiOutput.subject,
  };
}

// ---------------------------------------------------------------------------
// Batch Cron Runner
// ---------------------------------------------------------------------------

export async function runWeeklyCheckinCron(options?: {
  forceUserId?: string;
  appUrl?: string;
}): Promise<WeeklyCheckinCronSummary> {
  const startTime = new Date().toISOString();
  const results: ProcessCheckinResult[] = [];

  let eligibleProfiles: Profile[] = [];

  if (options?.forceUserId) {
    const single = await getProfile(options.forceUserId);
    if (single && single.onboardingCompleted) {
      eligibleProfiles = [single];
    }
  } else {
    eligibleProfiles = await listOnboardedProfiles();
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const profile of eligibleProfiles) {
    try {
      const result = await processWeeklyCheckinForProfile(profile, {
        appUrl: options?.appUrl,
        force: Boolean(options?.forceUserId),
      });

      results.push(result);

      if (result.status === "sent") sentCount++;
      else if (result.status === "skipped") skippedCount++;
      else failedCount++;

      // Log sanitized progress without exposing credentials
      console.log(
        `[WeeklyCheckinCron] user=${profile.clerkUserId} recipient=${maskEmail(result.recipientEmail)} provider=${result.provider} status=${result.status}`
      );
    } catch (err) {
      failedCount++;
      const errorMsg = err instanceof Error ? err.message : "Unexpected checkin processing failure";
      console.error(`[WeeklyCheckinCron] Exception for user ${profile.clerkUserId}:`, errorMsg);

      results.push({
        userId: profile.clerkUserId,
        recipientEmail: profile.email,
        provider: "resend",
        status: "failed",
        error: errorMsg,
        errorCategory: "UNHANDLED_EXCEPTION",
      });
    }
  }

  return {
    job: "weekly_checkin",
    timestamp: startTime,
    totalEligible: eligibleProfiles.length,
    processedCount: results.length,
    sentCount,
    skippedCount,
    failedCount,
    results,
  };
}
