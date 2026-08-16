import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { updateProfileSchema } from "@/lib/validation/profile";
import { CAREER_STAGE_OPTIONS } from "@/components/settings/profile-form";
import { COACHING_TONE_OPTIONS } from "@/components/settings/preferences-view";

describe("Profile Validation & Data Schema", () => {
  test("validates valid profile update payload with name and careerStage", () => {
    const valid = updateProfileSchema.safeParse({
      name: "Marcus Aurelius",
      careerStage: "Executive / Director",
      challenge: "Managing high-stakes board discussions under tight deadlines",
      monthlyGoal: "Present quarterly roadmap with unshakeable conviction",
    });

    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.name, "Marcus Aurelius");
      assert.equal(valid.data.careerStage, "Executive / Director");
    }
  });

  test("rejects invalid goal lengths that are too short", () => {
    const invalid = updateProfileSchema.safeParse({
      monthlyGoal: "abc",
    });

    assert.equal(invalid.success, false);
  });

  test("contains all required career stage options", () => {
    assert.ok(CAREER_STAGE_OPTIONS.includes("Foundational / Early Career"));
    assert.ok(CAREER_STAGE_OPTIONS.includes("Senior Lead / Manager"));
    assert.ok(CAREER_STAGE_OPTIONS.includes("Founder / C-Suite"));
  });

  test("contains defined coaching tone options", () => {
    assert.equal(COACHING_TONE_OPTIONS.length, 3);
    const ids = COACHING_TONE_OPTIONS.map((t) => t.id);
    assert.ok(ids.includes("supportive"));
    assert.ok(ids.includes("direct"));
    assert.ok(ids.includes("analytical"));
  });
});
