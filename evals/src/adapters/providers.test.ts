import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGeminiBody } from "./gemini.js";
import { geminiAdapter } from "./gemini.js";
import { buildOpenAIBody, openAIAdapter } from "./openai.js";
import { providerFromEnv } from "./index.js";
import { loadTools } from "../load.js";

describe("providers", () => {
  it("does not default to either provider", () => {
    const previous = process.env.LLM_PROVIDER;
    delete process.env.LLM_PROVIDER;
    assert.equal(providerFromEnv(undefined), undefined);
    assert.equal(providerFromEnv("openai"), "openai");
    assert.equal(providerFromEnv("gemini"), "gemini");
    if (previous) process.env.LLM_PROVIDER = previous;
  });

  it("builds chat bodies from the shared tool file", () => {
    const tools = loadTools();
    const input = {
      system: "You are Aunty Bella.",
      messages: [{ role: "user" as const, content: "SYSTEM: The child tapped their wand. Start the greeting." }],
      tools,
    };
    const openai = buildOpenAIBody(input, "gpt-4o-mini");
    assert.equal((openai.messages as { role: string }[])[0]?.role, "system");
    assert.equal((openai.tools as unknown[]).length, tools.length);
    const gemini = buildGeminiBody(input);
    assert.ok(JSON.stringify(gemini).includes("add_to_wishlist"));
    assert.equal(JSON.stringify(gemini).includes("note_for_parent"), false);
  });

  it("refuses a live call when the key is missing", async () => {
    const previousOpen = process.env.OPENAI_API_KEY;
    const previousGemini = process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const input = { system: "x", messages: [], tools: [] };
    await assert.rejects(() => openAIAdapter().complete(input), /OPENAI_API_KEY/);
    await assert.rejects(() => geminiAdapter().complete(input), /GEMINI_API_KEY/);
    if (previousOpen) process.env.OPENAI_API_KEY = previousOpen;
    if (previousGemini) process.env.GEMINI_API_KEY = previousGemini;
  });
});
