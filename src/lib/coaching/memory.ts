import type { ChatMessage } from "@/types/coaching";
import type { UserProfile } from "@/types/user";
import { generatePersonalizedSystemPrompt } from "../ai/prompts";

export interface ContextWindowOptions {
  profile: Partial<UserProfile>;
  history: ChatMessage[];
  maxRecentMessages?: number;
}

export function buildCoachingContextWindow(options: ContextWindowOptions) {
  const { profile, history, maxRecentMessages = 10 } = options;

  const systemMessage = {
    role: "system" as const,
    content: generatePersonalizedSystemPrompt(profile),
  };

  // Slice recent messages to preserve prompt budget
  const recentHistory = history.slice(-maxRecentMessages).map((msg) => ({
    role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  return [systemMessage, ...recentHistory];
}
