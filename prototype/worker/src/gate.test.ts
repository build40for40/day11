import assert from "node:assert/strict";
import { test } from "node:test";
import { newGate, passesGate } from "./gate";

test("the grown-up check asks a times table sum and only accepts the right number", () => {
  const gate = newGate(() => 0.3);
  assert.deepEqual(gate, { question: "What is 7 times 7?", answer: 49 });
  assert.ok(passesGate(gate, 49));
  assert.ok(!passesGate(gate, 48));
  assert.ok(!passesGate(gate, "49"));
  assert.ok(!passesGate(gate, undefined));
});
