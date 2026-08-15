import { z } from "zod";

// ---------------------------------------------------------------------------
// Intent Enum & Values
// ---------------------------------------------------------------------------

export const COACHING_INTENTS = [
  "salary",
  "interview",
  "career_change",
  "leadership",
  "confidence",
  "balance",
  "general",
] as const;

export const coachingIntentEnum = z.enum(COACHING_INTENTS);
export type CoachingIntent = z.infer<typeof coachingIntentEnum>;

// ---------------------------------------------------------------------------
// Strict AI Coaching Response Schema Contract
// ---------------------------------------------------------------------------

export const aiCoachingResponseSchema = z.object({
  main_advice: z
    .string()
    .min(1, "main_advice cannot be empty")
    .describe("High-impact, actionable cognitive-behavioral advice"),
  actionable_step: z
    .string()
    .min(1, "actionable_step cannot be empty")
    .describe("One concrete, low-friction micro-action the user can perform immediately"),
  follow_up_question: z
    .string()
    .min(1, "follow_up_question cannot be empty")
    .describe("A targeted, thought-provoking coaching question to deepen the reflection"),
  intent_detected: coachingIntentEnum.describe(
    "The primary coaching category detected for this message turn"
  ),
});

export type AICoachingResponse = z.infer<typeof aiCoachingResponseSchema>;

// ---------------------------------------------------------------------------
// Robust JSON Extraction & Parsing
// ---------------------------------------------------------------------------

/**
 * Extracts and parses a JSON object from raw LLM output, gracefully stripping
 * markdown codeblocks (```json ... ```), preamble, or trailing commentary.
 */
export function extractJsonFromModelOutput(rawOutput: string): unknown {
  if (!rawOutput || typeof rawOutput !== "string") {
    throw new Error("Empty model output received");
  }

  const trimmed = rawOutput.trim();

  // 1. Direct JSON parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to regex extraction
  }

  // 2. Extract from markdown code fences: ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue to bracket matching
    }
  }

  // 3. Extract the outermost JSON object bounds { ... }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (parseError) {
      throw new Error(
        `Failed to parse extracted JSON object: ${parseError instanceof Error ? parseError.message : "SyntaxError"}`
      );
    }
  }

  throw new Error("No valid JSON structure found in model output");
}

/**
 * Validates raw model output text against the strict AICoachingResponse contract.
 */
export function validateCoachingResponse(rawOutput: string): AICoachingResponse {
  const json = extractJsonFromModelOutput(rawOutput);
  const parsed = aiCoachingResponseSchema.safeParse(json);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`AI output failed schema validation contract: [${issues}]`);
  }

  return parsed.data;
}
