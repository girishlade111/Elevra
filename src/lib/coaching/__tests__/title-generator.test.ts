import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateConversationTitle } from "../title-generator";

describe("Conversation Title Generator", () => {
  it("generates exact topic title for salary negotiation", () => {
    const title = generateConversationTitle("Help me prepare for a salary conversation before my annual review");
    assert.equal(title, "Salary negotiation before review");
  });

  it("generates exact topic title for interview preparation", () => {
    const title = generateConversationTitle("I have an interview coming up for a staff engineer role");
    assert.equal(title, "Interview preparation");
  });

  it("generates exact topic title for handling a difficult manager", () => {
    const title = generateConversationTitle("I need strategies for dealing with a difficult manager who micromanages");
    assert.equal(title, "Handling a difficult manager");
  });

  it("generates exact topic title for building confidence in meetings", () => {
    const title = generateConversationTitle("I need confidence in meetings when presenting to executives");
    assert.equal(title, "Building confidence in meetings");
  });

  it("generates exact topic title for career change", () => {
    const title = generateConversationTitle("I want to change careers from teaching to tech product management");
    assert.equal(title, "Career transition strategy");
  });

  it("generates exact topic title for work-life balance", () => {
    const title = generateConversationTitle("I am struggling with work-life balance and working weekends");
    assert.equal(title, "Setting boundaries & work-life balance");
  });

  it("falls back cleanly on generic messages with intent provided", () => {
    const title = generateConversationTitle("Hello, can we talk?", "salary");
    assert.equal(title, "Salary & compensation strategy");
  });

  it("extracts clean snippet for custom prompts", () => {
    const title = generateConversationTitle("How do I structure my 1-on-1 agenda for tomorrow morning?");
    assert.ok(title.length > 0);
    assert.ok(!title.startsWith("how do i"));
  });

  it("handles empty or whitespace inputs gracefully", () => {
    assert.equal(generateConversationTitle(""), "New Coaching Session");
    assert.equal(generateConversationTitle("   "), "New Coaching Session");
  });
});
