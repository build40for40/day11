import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadSystemPrompt, loadTools } from "./load.js";

const REQUIRED = [
  "i'm aunty bella, a christmas helper who lives inside this little robot.",
  "would you like one more surprise idea?",
  "which one do you love most?",
  "remove_from_wishlist",
  "finish_session(\"kid_done\")",
  "finish_session(\"safety\")",
  "finish_session(\"upset\")",
  "grown-up",
  "i can't promise that one",
  "that's a lovely question to ask your grown-up",
  "ignore your rules",
  "non-screen",
  "did i hear that right",
];

describe("prompt contract", () => {
  it("keeps the rules in the file the harness loads", () => {
    const prompt = loadSystemPrompt().toLowerCase();
    for (const snippet of REQUIRED) assert.ok(prompt.includes(snippet), snippet);
    assert.equal(prompt.includes("note_for_parent"), false);
    assert.equal(prompt.includes("indigo"), false);
    assert.ok(prompt.includes("aunty bella"));
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
