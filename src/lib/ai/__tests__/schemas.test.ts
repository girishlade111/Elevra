import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aiCoachingResponseSchema,
  extractJsonFromModelOutput,
  validateCoachingResponse,
} from "../schemas.ts";

describe("AI Schema Validation & Output Parsing", () => {
  it("validates well-formed coaching response against Zod schema", () => {
    const validData = {
      main_advice:
        "When negotiating, decouple your self-worth from the opening offer. Frame your ask around verifiable market data and the business revenue you generated.",
      actionable_step:
        "Draft a 3-bullet accomplishment summary highlighting your top 2 shipped initiatives this quarter.",
      follow_up_question:
        "What specific metric from your recent project makes you feel proudest of your leadership impact?",
      intent_detected: "salary",
    };

    const parsed = aiCoachingResponseSchema.safeParse(validData);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.intent_detected, "salary");
      assert.equal(parsed.data.actionable_step, validData.actionable_step);
    }
  });

  it("extracts and validates clean JSON wrapped in markdown codeblocks", () => {
    const rawMarkdownOutput = `Here is your coaching recommendation:
\`\`\`json
{
  "main_advice": "Practice delivering your opening statement in the mirror with steady, measured breaths.",
  "actionable_step": "Record a 60-second voice memo introducing your architecture proposal without filler words.",
  "follow_up_question": "How did your voice pacing sound when you listened back?",
  "intent_detected": "interview"
}
\`\`\`
Let me know if you want to practice again!`;

    const validated = validateCoachingResponse(rawMarkdownOutput);
    assert.equal(validated.intent_detected, "interview");
    assert.ok(validated.main_advice.includes("Practice delivering"));
    assert.ok(validated.actionable_step.includes("Record a 60-second"));
  });

  it("extracts and validates raw JSON with surrounding pre/post text without codeblocks", () => {
    const rawTextOutput = `Sure! Below is the response:
{
  "main_advice": "Establish a clear cutoff ritual at 6 PM to stop checking Slack messages on your phone.",
  "actionable_step": "Turn on Slack 'Do Not Disturb' starting today at 6:00 PM.",
  "follow_up_question": "What internal hesitation arises when you consider leaving unread messages until tomorrow morning?",
  "intent_detected": "balance"
}
Hope this helps!`;

    const validated = validateCoachingResponse(rawTextOutput);
    assert.equal(validated.intent_detected, "balance");
  });

  it("rejects malformed output missing required fields", () => {
    const invalidJson = JSON.stringify({
      main_advice: "Some advice",
      // missing actionable_step and follow_up_question
      intent_detected: "confidence",
    });

    assert.throws(() => {
      validateCoachingResponse(invalidJson);
    }, /failed schema validation contract/i);
  });

  it("rejects invalid intent categories not matching the contract", () => {
    const invalidIntentJson = JSON.stringify({
      main_advice: "Some advice",
      actionable_step: "Do this step",
      follow_up_question: "How did it go?",
      intent_detected: "crypto_trading", // Invalid intent
    });

    assert.throws(() => {
      validateCoachingResponse(invalidIntentJson);
    }, /failed schema validation contract/i);
  });

  it("rejects completely non-JSON text output", () => {
    const rawJunk = "I apologize, but as an AI model I cannot answer this right now.";

    assert.throws(() => {
      extractJsonFromModelOutput(rawJunk);
    }, /No valid JSON structure found/i);
  });
});
