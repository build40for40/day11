import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadSystemPrompt, loadTools } from "./load.js";

const REQUIRED = [
  // Light prompt (2026-11-16): only the hard safety rules and approved lines are pinned.
  "i'm glisten, a christmas helper who lives inside this little robot.",
  "that's a lovely question to ask {grownup_label}",
  "remove_from_wishlist",
  "add_to_wishlist",
  "finish_session(\"safety\")",
  "finish_session(\"upset\")",
  "{grownup_label}",
  "{holiday_mode}",
  "water beads",
  "button batteries",
  "magnets",
  "weapons",
  "screen",
  "surname",
  "ignore your rules",
  "never promise",
  "one question at a time",
  "never say your thinking out loud",
  "don't offer one more",
];

describe("prompt contract", () => {
  it("keeps the rules in the file the harness loads", () => {
    const prompt = loadSystemPrompt().toLowerCase();
    for (const snippet of REQUIRED) assert.ok(prompt.includes(snippet), snippet);
    assert.equal(prompt.includes("note_for_parent"), false);
    assert.equal(prompt.includes("indigo"), false);
    assert.ok(prompt.includes("glisten"));
  });

  it("loads the worker tools and not a parent-note tool", () => {
    const names = loadTools().map((tool) => tool.name).sort();
    assert.deepEqual(names, [
      "add_to_wishlist",
      "finish_session",
      "nod",
      "remove_from_wishlist",
      "set_leds",
      "set_mood",
      "shake",
    ]);
  });
});
