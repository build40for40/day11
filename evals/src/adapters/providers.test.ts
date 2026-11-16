import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAnthropicBody, parseAnthropicTurn, anthropicAdapter } from "./anthropic.js";
import { buildGeminiBody } from "./gemini.js";
import { geminiAdapter } from "./gemini.js";
import { buildOpenAIBody, openAIAdapter } from "./openai.js";
import { providerFromEnv } from "./index.js";
import { loadTools } from "../load.js";

describe("providers", () => {
  it("does not default to a provider", () => {
    const previous = process.env.LLM_PROVIDER;
    delete process.env.LLM_PROVIDER;
    assert.equal(providerFromEnv(undefined), undefined);
    assert.equal(providerFromEnv("openai"), "openai");
    assert.equal(providerFromEnv("gemini"), "gemini");
    assert.equal(providerFromEnv("anthropic"), "anthropic");
    assert.equal(providerFromEnv("claude"), "anthropic");
    if (previous) process.env.LLM_PROVIDER = previous;
  });

  it("builds chat bodies from the shared tool file", () => {
    const tools = loadTools();
    const input = {
      system: "You are Glisten.",
      messages: [{ role: "user" as const, content: "SYSTEM: The child tapped their wand. Start the greeting." }],
      tools,
    };
    const openai = buildOpenAIBody(input, "gpt-4o-mini");
    assert.equal((openai.messages as { role: string }[])[0]?.role, "system");
    assert.equal((openai.tools as unknown[]).length, tools.length);
    const gemini = buildGeminiBody(input);
    assert.ok(JSON.stringify(gemini).includes("add_to_wishlist"));
    assert.equal(JSON.stringify(gemini).includes("note_for_parent"), false);
    const anthropic = buildAnthropicBody(input, "claude-sonnet-5-5");
    assert.equal(anthropic.system, "You are Glisten.");
    assert.equal((anthropic.messages as { role: string }[])[0]?.role, "user");
    assert.equal((anthropic.tools as { name: string; input_schema: unknown }[]).length, tools.length);
    assert.ok((anthropic.tools as { input_schema: unknown }[])[0]?.input_schema);
    assert.equal(JSON.stringify(anthropic).includes("note_for_parent"), false);
    assert.deepEqual(anthropic.thinking, { type: "between_tools" });
  });

  it("omits the tools field when none are given", () => {
    const openai = buildOpenAIBody({ system: "s", messages: [], tools: [] }, "gpt-4.1");
    assert.equal("tools" in openai, false);
    assert.equal("tool_choice" in openai, false);
    const anthropic = buildAnthropicBody({ system: "s", messages: [], tools: [] }, "claude-haiku-5-5");
    assert.equal("tools" in anthropic, false);
    assert.deepEqual(anthropic.thinking, { type: "disabled" });
  });

  it("maps tool results onto a user tool_result turn", () => {
    const body = buildAnthropicBody(
      {
        system: "sys",
        messages: [
          { role: "user", content: "hello" },
          {
            role: "assistant",
            content: "Nice.",
            toolCalls: [{ id: "toolu_1", name: "nod", arguments: {} }],
          },
          { role: "tool", toolCallId: "toolu_1", name: "nod", content: '{"ok":true}' },
          { role: "user", content: "yes" },
        ],
        tools: [],
      },
      "claude-sonnet-5-5",
    );
    const messages = body.messages as { role: string; content: unknown }[];
    assert.equal(messages.length, 3);
    assert.equal(messages[1]?.role, "assistant");
    assert.equal(messages[2]?.role, "user");
    const userBlocks = messages[2]?.content as { type: string; tool_use_id?: string; text?: string }[];
    assert.equal(userBlocks[0]?.type, "tool_result");
    assert.equal(userBlocks[0]?.tool_use_id, "toolu_1");
    assert.equal(userBlocks[1]?.type, "text");
    assert.equal(userBlocks[1]?.text, "yes");
  });

  it("puts every tool_result before any system text after a tool_use turn", () => {
    const body = buildAnthropicBody(
      {
        system: "sys",
        messages: [
          { role: "user", content: "hello" },
          {
            role: "assistant",
            content: "ok",
            toolCalls: [
              { id: "toolu_a", name: "set_leds", arguments: { colour: "green" } },
              { id: "toolu_b", name: "nod", arguments: {} },
            ],
          },
          { role: "tool", toolCallId: "toolu_a", name: "set_leds", content: "{}" },
          { role: "user", content: "SYSTEM: Lights are green." },
          { role: "tool", toolCallId: "toolu_b", name: "nod", content: "{}" },
          { role: "user", content: "yes" },
        ],
        tools: [],
      },
      "claude-sonnet-5-5",
    );
    const messages = body.messages as { role: string; content: unknown }[];
    assert.equal(messages.length, 3);
    const blocks = messages[2]?.content as { type: string; tool_use_id?: string; text?: string }[];
    assert.equal(blocks[0]?.type, "tool_result");
    assert.equal(blocks[0]?.tool_use_id, "toolu_a");
    assert.equal(blocks[1]?.type, "tool_result");
    assert.equal(blocks[1]?.tool_use_id, "toolu_b");
    assert.ok(blocks.slice(2).every((block) => block.type !== "tool_use"));
    assert.ok(blocks.some((block) => block.type === "text" && block.text?.includes("Lights are green")));
    assert.ok(blocks.some((block) => block.type === "text" && block.text === "yes"));
  });

  it("parses Anthropic text and tool_use blocks", () => {
    const turn = parseAnthropicTurn({
      content: [
        { type: "text", text: "A wooden train?" },
        { type: "tool_use", id: "toolu_9", name: "add_to_wishlist", input: { item: "wooden train", reason: "Jack likes trains" } },
      ],
    });
    assert.equal(turn.text, "A wooden train?");
    assert.equal(turn.toolCalls[0]?.id, "toolu_9");
    assert.equal(turn.toolCalls[0]?.name, "add_to_wishlist");
    assert.equal(turn.toolCalls[0]?.arguments.item, "wooden train");
  });

  it("refuses a live call when the key is missing", async () => {
    const previousOpen = process.env.OPENAI_API_KEY;
    const previousGemini = process.env.GEMINI_API_KEY;
    const previousAnthropic = process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const input = { system: "x", messages: [], tools: [] };
    await assert.rejects(() => openAIAdapter().complete(input), /OPENAI_API_KEY/);
    await assert.rejects(() => geminiAdapter().complete(input), /GEMINI_API_KEY/);
    await assert.rejects(() => anthropicAdapter().complete(input), /ANTHROPIC_API_KEY/);
    if (previousOpen) process.env.OPENAI_API_KEY = previousOpen;
    if (previousGemini) process.env.GEMINI_API_KEY = previousGemini;
    if (previousAnthropic) process.env.ANTHROPIC_API_KEY = previousAnthropic;
  });
});
