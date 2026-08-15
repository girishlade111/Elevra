import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectIntentLocal } from "../intent";

describe("Local Intent Detection Engine", () => {
  it("accurately detects salary negotiation intent", () => {
    const messages = [
      "I need help asking for a 15% salary raise during my annual review.",
      "How do I respond to this lowball counteroffer on base pay and equity?",
      "What is the market rate for Senior Product Manager compensation?",
      "I want to negotiate my starting salary and sign-on bonus.",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "salary", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("accurately detects interview preparation intent", () => {
    const messages = [
      "I have a final round behavioral interview with the VP of Engineering tomorrow.",
      "How can I structure my answer using the STAR method for leadership questions?",
      "I want to do a mock interview for a technical recruiter screen.",
      "How do I answer 'tell me about yourself' without rambling?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "interview", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("accurately detects career change intent", () => {
    const messages = [
      "I'm planning a career change from teaching into tech product management.",
      "How do I position my transferable skills for a career pivot into UX?",
      "I want to transition into consulting from a non-traditional background.",
      "How do I break into machine learning engineering from marketing?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "career_change", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("accurately detects leadership & assertiveness intent", () => {
    const messages = [
      "I keep getting interrupted in executive meetings when presenting architecture.",
      "How do I manage up with an aggressive stakeholder without being defensive?",
      "I was just promoted to Engineering Director and need help asserting decision authority.",
      "How do I push back on unrealistic deadlines with my executive team?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "leadership", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("accurately detects confidence & imposter syndrome intent", () => {
    const messages = [
      "I'm suffering from intense imposter syndrome and feel like a total fraud.",
      "I second-guess every decision I make and feel unqualified for this staff role.",
      "I feel not good enough and constantly overthink my team contributions.",
      "How can I build unshakeable confidence when surrounded by senior peers?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "confidence", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("accurately detects work-life balance intent", () => {
    const messages = [
      "I'm completely burned out and working 60 hours a week including weekends.",
      "I feel immense guilt logging off at 6 PM when my manager sends after-hours emails.",
      "My work-life balance is totally unsustainable and I'm mentally exhausted.",
      "How do I set firm boundaries with my boss to prevent constant overworking?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "balance", `Failed for message: "${msg}"`);
      assert.equal(result.isConfident, true);
    }
  });

  it("returns general when message has low or zero keyword confidence", () => {
    const messages = [
      "Hello coach, good morning!",
      "What do you think about this situation?",
      "Can we discuss my plans?",
    ];

    for (const msg of messages) {
      const result = detectIntentLocal(msg);
      assert.equal(result.intent, "general", `Failed for message: "${msg}"`);
    }
  });
});
