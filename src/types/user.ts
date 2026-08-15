export type ConfidenceArea =
  | "public_speaking"
  | "career_negotiation"
  | "social_interactions"
  | "leadership"
  | "imposter_syndrome"
  | "decision_making"
  | "dating_relationships"
  | "general_self_worth";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  preferredName: string | null;
  primaryGoal: string;
  confidenceAreas: ConfidenceArea[];
  currentChallenge: string;
  baselineScore: number; // 1-10 scale
  coachingTone: "supportive" | "direct" | "challenging" | "socratic";
  emailUpdatesEnabled: boolean;
  preferredEmailTime: string; // e.g. "09:00"
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}
