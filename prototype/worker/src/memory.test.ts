import assert from "node:assert/strict";
import { test } from "node:test";
import { addMemoryLine, MEMORY_LINE_MAX, MEMORY_MAX, oneLine, rewriteMemory } from "./memory";

test("adding a line appends it on its own row and skips repeats", () => {
  const memory = addMemoryLine("Likes toy diggers.", "  Said no to\n a kite.  ");
  assert.equal(memory, "Likes toy diggers.\nSaid no to a kite.");
  assert.equal(addMemoryLine(memory, "Likes toy diggers."), memory);
  assert.equal(addMemoryLine(memory, "   "), memory);
});

test("adding past the cap drops the oldest lines first", () => {
  let memory = "";
  for (let i = 0; i < 40; i++) memory = addMemoryLine(memory, `Fact ${i} ${"x".repeat(60)}`);
  assert.ok(memory.length <= MEMORY_MAX);
  assert.ok(!memory.includes("Fact 0 "));
  assert.ok(memory.endsWith(`Fact 39 ${"x".repeat(60)}`));
});

test("a rewrite replaces the memory, tidies lines and stays under the cap", () => {
  assert.equal(rewriteMemory("\n  Loves   dinosaurs. \n\nWants a toy horse.\n"), "Loves dinosaurs.\nWants a toy horse.");
  assert.equal(rewriteMemory(""), "");
  const long = rewriteMemory(Array.from({ length: 30 }, (_, i) => `Line ${i} ${"y".repeat(300)}`).join("\n"));
  assert.ok(long.length <= MEMORY_MAX);
  assert.ok(long.split("\n").every((line) => line.length <= MEMORY_LINE_MAX));
});

test("oneLine flattens whitespace and trims to the limit", () => {
  assert.equal(oneLine("  Testy \n McTestface  ", 40), "Testy McTestface");
  assert.equal(oneLine("abcdef", 3), "abc");
});
