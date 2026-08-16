/**
 * @fileoverview Validation schemas for AI-generated weekly check-in syntheses.
 */
import { z } from "zod";

export const weeklyCheckinAiOutputSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  greeting: z.string().min(2, "Greeting must be at least 2 characters"),
  progress_acknowledgment: z
    .string()
    .min(10, "Progress acknowledgment must be at least 10 characters"),
  weekly_challenge: z
    .string()
    .min(10, "Weekly challenge must be at least 10 characters"),
  motivational_quote: z
    .string()
    .min(10, "Motivational quote must be at least 10 characters"),
  closing: z.string().min(5, "Closing must be at least 5 characters"),
});

export type WeeklyCheckinAiOutput = z.infer<typeof weeklyCheckinAiOutputSchema>;
