import { z } from "zod";

export const confidenceAreasEnum = z.enum([
  "public_speaking",
  "career_negotiation",
  "social_interactions",
  "leadership",
  "imposter_syndrome",
  "decision_making",
  "dating_relationships",
  "general_self_worth",
]);

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  preferredName: z.string().max(60).optional(),
  primaryGoal: z
    .string()
    .min(10, "Please provide a detailed goal of at least 10 characters")
    .max(500),
  confidenceAreas: z
    .array(confidenceAreasEnum)
    .min(1, "Select at least one confidence focus area"),
  currentChallenge: z
    .string()
    .min(10, "Describe your immediate challenge in at least 10 characters")
    .max(1000),
  baselineScore: z.number().int().min(1).max(10),
  coachingTone: z.enum(["supportive", "direct", "challenging", "socratic"]).default("supportive"),
  emailUpdatesEnabled: z.boolean().default(true),
  preferredEmailTime: z.string().default("09:00"),
  timezone: z.string().default("UTC"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
