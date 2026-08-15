import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCoachingSystemPrompt,
  SPECIALIZED_COACHING_PERSONAS,
} from "../prompts";
import type { CoachingIntent } from "../schemas";

describe("Coaching Prompt Generation & Personalization", () => {
  it("includes all specialized personas for the 7 coaching intents", () => {
    const intents: CoachingIntent[] = [
      "salary",
      "interview",
      "career_change",
      "leadership",
      "confidence",
      "balance",
      "general",
    ];

    for (const intent of intents) {
      const persona = SPECIALIZED_COACHING_PERSONAS[intent];
      assert.ok(persona, `Missing persona for intent: ${intent}`);
      assert.ok(persona.title.length > 0);
      assert.ok(persona.prompt.length > 0);
    }
  });

  it("injects user personalization parameters accurately into system prompt", () => {
    const context = {
      userName: "Elena Rostova",
      careerStage: "Senior or Leadership",
      biggestChallenge: "Salary negotiation",
      monthlyGoal: "Secure a 20% promotion raise during Q3 review",
      detectedIntent: "salary" as CoachingIntent,
      memorySummary: "Elena previously led a successful 6-person migration project.",
    };

    const prompt = buildCoachingSystemPrompt(context);

    assert.ok(prompt.includes("Elena Rostova"), "Prompt should contain user name");
    assert.ok(prompt.includes("Senior or Leadership"), "Prompt should contain career stage");
    assert.ok(prompt.includes("Salary negotiation"), "Prompt should contain primary challenge");
    assert.ok(prompt.includes("Secure a 20% promotion raise during Q3 review"), "Prompt should contain monthly goal");
    assert.ok(prompt.includes("SALARY"), "Prompt should mention active intent");
    assert.ok(
      prompt.includes("Elena previously led a successful 6-person migration project."),
      "Prompt should include memory summary"
    );
  });

  it("embeds safety rules and non-medical/non-legal boundary directives", () => {
    const prompt = buildCoachingSystemPrompt({
      userName: "Maya",
      detectedIntent: "confidence",
    });

    assert.ok(prompt.includes("NOT a licensed psychologist"), "Must disclaim licensed status");
    assert.ok(prompt.includes("consulting a qualified, licensed professional"), "Must include safe referral rule");
    assert.ok(prompt.includes("main_advice"), "Must include JSON output contract structure");
    assert.ok(prompt.includes("actionable_step"), "Must mandate 1 actionable micro-step");
    assert.ok(prompt.includes("follow_up_question"), "Must mandate 1 follow-up question");
  });

  it("handles empty / partial profile gracefully with sensible defaults", () => {
    const prompt = buildCoachingSystemPrompt({
      detectedIntent: "general",
    });

    assert.ok(prompt.includes("Client"), "Default name should be used");
    assert.ok(prompt.includes("Professional"), "Default stage should be used");
    assert.ok(prompt.includes("GENERAL"), "General intent should be present");
  });
});
