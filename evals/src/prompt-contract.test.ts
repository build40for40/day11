import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadSystemPrompt, loadTools } from "./load.js";

const REQUIRED = [
  "i'm aunty bella, a christmas helper who lives inside this little robot.",
  "one more surprise idea?",
  "finished_early",
  "which do you love most?",
  "remove_from_wishlist",
  "finish_session",
  "reason safety",
  "grown-up",
  "cannot promise",
  "santa is at the north pole",
  "switch to that child",
  "recorded clip",
  "nothing is saved",
  "repeat your best guess",
  "five minutes",
  "already on the list",
  "ignore your rules",
  "non-screen",
  "quiet for two turns",
  "emails mum only",
];

describe("prompt contract", () => {
  it("keeps the rules in the file the harness loads", () => {
    const prompt = loadSystemPrompt().toLowerCase();
    for (const snippet of REQUIRED) assert.ok(prompt.includes(snippet), snippet);
    assert.equal(prompt.includes("note_for_parent"), false);
    assert.equal(prompt.includes("kindly aunt"), false);
    assert.equal(prompt.includes("set_face"), false);
    assert.equal(prompt.includes("indigo"), false);
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
