import { z } from "zod";

// ---------------------------------------------------------------------------
// Sanitization Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitizes user input string: trims whitespace, removes control characters
 * and basic HTML tags to prevent XSS / markup injection.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Strip raw tag brackets
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // Remove ASCII control characters
}

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

// ---------------------------------------------------------------------------
// Allowed Values & Reference Constants
// ---------------------------------------------------------------------------


export const CAREER_STAGE_OPTIONS = [
  {
    id: "student_fresh_grad",
    value: "Student or Fresh Graduate",
    label: "Student or Fresh Graduate",
    description: "Preparing for or entering the professional workforce",
  },
  {
    id: "early_career",
    value: "Early Career (1-3 years)",
    label: "Early Career (1-3 years)",
    description: "Building foundational skills and professional identity",
  },
  {
    id: "mid_career",
    value: "Mid Career (4-8 years)",
    label: "Mid Career (4-8 years)",
    description: "Expanding impact, domain mastery, and seeking senior growth",
  },
  {
    id: "senior_leadership",
    value: "Senior or Leadership",
    label: "Senior or Leadership",
    description: "Leading teams, driving strategy, and executive influence",
  },
  {
    id: "career_changer",
    value: "Career Changer",
    label: "Career Changer",
    description: "Pivoting across domains, roles, or entire industries",
  },
] as const;

export const CHALLENGE_OPTIONS = [
  {
    id: "salary_negotiation",
    value: "Salary negotiation",
    label: "Salary negotiation",
    description: "Negotiating offers, promotion packages, and compensation parity",
  },
  {
    id: "interview_confidence",
    value: "Interview confidence",
    label: "Interview confidence",
    description: "Articulating value clearly under pressure and overcoming anxiety",
  },
  {
    id: "career_change",
    value: "Career change or pivot",
    label: "Career change or pivot",
    description: "Positioning transferable skills for a successful transition",
  },
  {
    id: "leadership_assertiveness",
    value: "Leadership and assertiveness",
    label: "Leadership and assertiveness",
    description: "Holding boundaries, speaking up in high-stakes rooms, and decision confidence",
  },
  {
    id: "work_life_balance",
    value: "Work-life balance",
    label: "Work-life balance",
    description: "Managing stress, sustainable boundaries, and avoiding burnout",
  },
  {
    id: "building_network",
    value: "Building my network",
    label: "Building my network",
    description: "Initiating relationships, outreach confidence, and finding mentors",
  },
] as const;

export const ALLOWED_CAREER_STAGES = [
  "Student or Fresh Graduate",
  "Early Career (1-3 years)",
  "Mid Career (4-8 years)",
  "Senior or Leadership",
  "Career Changer",
  // Slug variations for flexibility
  "student",
  "early_career",
  "mid_career",
  "senior",
  "career_changer",
] as const;

export const ALLOWED_CHALLENGES = [
  "Salary negotiation",
  "Interview confidence",
  "Career change or pivot",
  "Leadership and assertiveness",
  "Work-life balance",
  "Building my network",
] as const;

// ---------------------------------------------------------------------------
// Discrete Step Schemas
// ---------------------------------------------------------------------------

/** Step 1: User's Name */
export const step1NameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .transform(sanitizeInput),
});

/** Step 2: Career Stage */
export const step2CareerStageSchema = z.object({
  careerStage: z
    .string()
    .trim()
    .refine(
      (val) => (ALLOWED_CAREER_STAGES as readonly string[]).includes(val),
      {
        message: "Please select a valid career stage from the list",
      }
    ),
});

/** Step 3: Biggest Challenge */
export const step3ChallengeSchema = z.object({
  challenge: z
    .string()
    .trim()
    .refine(
      (val) => (ALLOWED_CHALLENGES as readonly string[]).includes(val),
      {
        message: "Please select a valid challenge from the list",
      }
    ),
});

/** Step 4: Monthly Goal */
export const step4MonthlyGoalSchema = z.object({
  monthlyGoal: z
    .string()
    .trim()
    .min(1, "Please describe your goal for this month")
    .min(5, "Goal should be at least 5 characters to give your coach clear context")
    .max(500, "Goal cannot exceed 500 characters")
    .transform(sanitizeInput),
});

// ---------------------------------------------------------------------------
// Step-by-Step API Payload Schema (Discriminated by `step`)
// ---------------------------------------------------------------------------

export const saveStepPayloadSchema = z.object({
  step: z.number().int().min(1).max(4),
  name: z.string().max(100).optional(),
  careerStage: z.string().max(100).optional(),
  challenge: z.string().max(100).optional(),
  monthlyGoal: z.string().max(500).optional(),
  isComplete: z.boolean().optional(),
});

export type SaveStepPayload = z.infer<typeof saveStepPayloadSchema>;

// ---------------------------------------------------------------------------
// Complete Onboarding Profile Schema
// ---------------------------------------------------------------------------

export const completeOnboardingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .transform(sanitizeInput),
  careerStage: z
    .string()
    .trim()
    .refine((val) => (ALLOWED_CAREER_STAGES as readonly string[]).includes(val), {
      message: "Please select a valid career stage",
    }),
  challenge: z
    .string()
    .trim()
    .refine((val) => (ALLOWED_CHALLENGES as readonly string[]).includes(val), {
      message: "Please select a valid challenge",
    }),
  monthlyGoal: z
    .string()
    .trim()
    .min(5, "Monthly goal must be at least 5 characters")
    .max(500)
    .transform(sanitizeInput),
  onboardingStep: z.number().int().min(0).max(4).default(4),
  onboardingCompleted: z.boolean().default(true),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

// ---------------------------------------------------------------------------
// Legacy Compatibility Export (for existing imports)
// ---------------------------------------------------------------------------

export const onboardingSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  preferredName: z.string().max(60).optional(),
  name: z.string().min(2).max(100).optional(),
  careerStage: z.string().optional(),
  challenge: z.string().optional(),
  currentChallenge: z.string().optional(),
  monthlyGoal: z.string().optional(),
  primaryGoal: z.string().optional(),
  confidenceAreas: z.array(z.string()).optional(),
  baselineScore: z.number().int().min(1).max(10).optional(),
  coachingTone: z.string().optional(),
  emailUpdatesEnabled: z.boolean().optional(),
  preferredEmailTime: z.string().optional(),
  timezone: z.string().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
