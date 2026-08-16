import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Accessibility & Design Language Standards", () => {
  const globalsCssPath = path.join(process.cwd(), "src/styles/globals.css");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  test("defines all mandatory monochrome and semantic palette tokens", () => {
    assert.ok(globalsCss.includes("#0d0d0d"), "Must contain background #0d0d0d");
    assert.ok(globalsCss.includes("#161616"), "Must contain panel #161616");
    assert.ok(globalsCss.includes("#1c1c1c"), "Must contain surface #1c1c1c");
    assert.ok(globalsCss.includes("#242424"), "Must contain hover #242424");
    assert.ok(globalsCss.includes("#2a2a2a"), "Must contain border #2a2a2a");
    assert.ok(globalsCss.includes("#e8e8e8"), "Must contain text #e8e8e8");
    assert.ok(globalsCss.includes("#8a8a8a"), "Must contain secondary #8a8a8a");
    assert.ok(globalsCss.includes("#5c5c5c"), "Must contain muted #5c5c5c");
    assert.ok(globalsCss.includes("#e07856"), "Must contain accent #e07856");
    assert.ok(globalsCss.includes("#3ecf5e"), "Must contain success #3ecf5e");
    assert.ok(globalsCss.includes("#e5484d"), "Must contain danger #e5484d");
  });

  test("enforces system-ui typography without decorative font imports", () => {
    assert.ok(globalsCss.includes("system-ui"), "Must specify system-ui font family");
    assert.ok(!globalsCss.includes("@import url('https://fonts"), "No external decorative webfonts in globals.css");
  });

  test("includes accessible focus-visible outline and skip-link styles", () => {
    assert.ok(globalsCss.includes(":focus-visible"), "Must declare visible focus indicator");
    assert.ok(globalsCss.includes(".skip-link"), "Must declare skip-link helper class");
  });

  test("supports prefers-reduced-motion media query", () => {
    assert.ok(globalsCss.includes("prefers-reduced-motion: reduce"), "Must respect user reduced-motion preference");
  });

  test("dense row utility maintains clean 1px border separation", () => {
    assert.ok(globalsCss.includes(".dense-row"), "Must declare .dense-row class");
    assert.ok(globalsCss.includes("border-bottom: 1px solid var(--border)"));
  });
});
