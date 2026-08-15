import { z } from "zod";
import { confidenceAreasEnum } from "./onboarding";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  fullName: z.string().min(2).max(100).optional(),
  preferredName: z.string().max(60).optional().nullable(),
  careerStage: z.string().optional(),
  challenge: z.string().optional(),
  monthlyGoal: z.string().min(5).max(500).optional(),
  primaryGoal: z.string().min(5).max(500).optional(),
  confidenceAreas: z.array(z.string()).optional(),
  currentChallenge: z.string().max(1000).optional(),
  baselineScore: z.number().int().min(1).max(10).optional(),
  coachingTone: z.enum(["supportive", "direct", "challenging", "socratic"]).optional(),
  emailUpdatesEnabled: z.boolean().optional(),
  preferredEmailTime: z.string().optional(),
  timezone: z.string().optional(),
});


export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
