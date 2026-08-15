export type CoachingIntent =
  | "situation_breakdown"
  | "roleplay_practice"
  | "mindset_reframing"
  | "action_planning"
  | "progress_reflection"
  | "crisis_encouragement"
  | "general_inquiry";

export interface StructuredCoachingResponse {
  intent: CoachingIntent;
  coachingMessage: string;
  keyInsights: string[];
  recommendedMicroAction: {
    title: string;
    description: string;
    estimatedMinutes: number;
  };
  followUpPrompt: string;
  confidenceIndicator: "low" | "building" | "steady" | "high";
}

export interface AIMessagePayload {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}
