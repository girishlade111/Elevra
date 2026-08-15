import type { UserProfile } from "@/types/user";
import type { ChatMessage } from "@/types/coaching";
import { aiClient } from "../ai/client";
import { renderWeeklyCheckinHtml } from "../email/templates";
import { sendAppEmail } from "../email";

export interface GenerateCheckinParams {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  recentMessages: ChatMessage[];
  appUrl: string;
}

export async function processWeeklyCheckinForUser(params: GenerateCheckinParams) {
  const { user, profile, recentMessages, appUrl } = params;

  const messagesSummary = recentMessages.length > 0
    ? recentMessages
        .slice(-6)
        .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
        .join("\n")
    : "No direct chat messages recorded this week. User is pursuing goal: " + profile.primaryGoal;

  const prompt = `You are generating a weekly coaching synthesis check-in email for ${profile.preferredName || profile.fullName || "the user"}.
Focus Area: ${profile.confidenceAreas.join(", ")}
Primary Goal: ${profile.primaryGoal}
Current Challenge: ${profile.currentChallenge}

Recent Activity Summary:
${messagesSummary}

Return a valid JSON object with:
- "reflectionSummary": (2-3 concise, encouraging sentences synthesizing the week)
- "recommendedMicroActions": (array of 2 concrete 5-minute micro actions)
- "coachQuestion": (1 insightful reflection question to ponder)
`;

  const completion = await aiClient.generateCoachingResponse({
    messages: [{ role: "user", content: prompt }],
    responseFormatJson: true,
  });

  let parsed: {
    reflectionSummary: string;
    recommendedMicroActions: string[];
    coachQuestion: string;
  };

  try {
    parsed = JSON.parse(completion.rawText);
  } catch {
    parsed = {
      reflectionSummary:
        "Every small step towards your confidence goals creates compounding momentum. Reflect on moments where you spoke up or chose growth this week.",
      recommendedMicroActions: [
        "Take a 5-minute confidence posture break before your next meeting.",
        "Acknowledge one personal win from this week in writing.",
      ],
      coachQuestion:
        "What is one situation this week where you felt hesitation, and what would 10% more boldness have looked like?",
    };
  }

  const emailHtml = renderWeeklyCheckinHtml({
    userName: profile.preferredName || profile.fullName || "there",
    primaryGoal: profile.primaryGoal,
    reflectionSummary: parsed.reflectionSummary,
    recommendedMicroActions: parsed.recommendedMicroActions,
    coachQuestion: parsed.coachQuestion,
    appUrl,
  });

  const sendResult = await sendAppEmail({
    to: user.email,
    subject: `Weekly Confidence Briefing: Progress on "${profile.primaryGoal.slice(0, 40)}..."`,
    html: emailHtml,
  });

  return {
    success: sendResult.success,
    data: parsed,
    sendResult,
  };
}
