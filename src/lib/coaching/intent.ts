import type { CoachingIntent } from "@/types/ai";
import { aiClient } from "../ai/client";

/**
 * Keyword heuristic classifier for instant fast-path intent detection
 */
export function detectIntentHeuristic(message: string): CoachingIntent | null {
  const lower = message.toLowerCase();

  if (
    lower.includes("roleplay") ||
    lower.includes("practice") ||
    lower.includes("rehearse") ||
    lower.includes("say to my boss") ||
    lower.includes("say to him") ||
    lower.includes("say to her")
  ) {
    return "roleplay_practice";
  }

  if (
    lower.includes("panic") ||
    lower.includes("terrified") ||
    lower.includes("shaking") ||
    lower.includes("in 5 minutes") ||
    lower.includes("right now")
  ) {
    return "crisis_encouragement";
  }

  if (
    lower.includes("imposter") ||
    lower.includes("not good enough") ||
    lower.includes("fraud") ||
    lower.includes("comparing myself")
  ) {
    return "mindset_reframing";
  }

  if (
    lower.includes("plan") ||
    lower.includes("steps") ||
    lower.includes("how to prepare") ||
    lower.includes("schedule")
  ) {
    return "action_planning";
  }

  if (
    lower.includes("went well") ||
    lower.includes("it happened") ||
    lower.includes("retrospective") ||
    lower.includes("aftermath")
  ) {
    return "progress_reflection";
  }

  return null;
}

/**
 * Robust intent detection combining local heuristic with AI classifier
 */
export async function resolveMessageIntent(message: string): Promise<CoachingIntent> {
  const heuristic = detectIntentHeuristic(message);
  if (heuristic) return heuristic;

  try {
    const rawResult = await aiClient.classifyIntent(message);
    const parsed = JSON.parse(rawResult) as { intent?: CoachingIntent };
    if (parsed.intent) return parsed.intent;
  } catch {
    // Graceful fallback to general inquiry
  }

  return "situation_breakdown";
}
