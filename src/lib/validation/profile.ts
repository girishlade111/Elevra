import { z } from "zod";
import { confidenceAreasEnum } from "./onboarding";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  preferredName: z.string().max(60).optional().nullable(),
  primaryGoal: z.string().min(10).max(500).optional(),
  confidenceAreas: z.array(confidenceAreasEnum).min(1).optional(),
  currentChallenge: z.string().min(10).max(1000).optional(),
  baselineScore: z.number().int().min(1).max(10).optional(),
  coachingTone: z.enum(["supportive", "direct", "challenging", "socratic"]).optional(),
  emailUpdatesEnabled: z.boolean().optional(),
  preferredEmailTime: z.string().optional(),
  timezone: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
