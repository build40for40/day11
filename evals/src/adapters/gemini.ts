import type { CompleteInput } from "./types.js";
import { normaliseTools } from "./types.js";
import type { ModelTurn, ToolCall } from "../types.js";

export function buildGeminiBody(input: CompleteInput): Record<string, unknown> {
  const contents: Record<string, unknown>[] = [];
  for (const message of input.messages) {
    if (message.role === "assistant") {
      const parts: Record<string, unknown>[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const tool of message.toolCalls ?? []) {
        parts.push({ functionCall: { name: tool.name, args: tool.arguments } });
      }
      contents.push({ role: "model", parts });
      continue;
    }
    if (message.role === "tool") {
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: message.name, response: JSON.parse(message.content || "{}") } }],
      });
      continue;
    }
    contents.push({ role: "user", parts: [{ text: message.content }] });
  }
  const functionDeclarations = normaliseTools(input.tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
  return {
    systemInstruction: { parts: [{ text: input.system }] },
    contents,
    tools: [{ functionDeclarations }],
  };
}

export function parseGeminiTurn(payload: unknown): ModelTurn {
  const parts = (payload as { candidates?: { content?: { parts?: Record<string, unknown>[] } }[] }).candidates?.[0]?.content?.parts ?? [];
  const texts: string[] = [];
  const toolCalls: ToolCall[] = [];
  let n = 0;
  for (const part of parts) {
    if (typeof part.text === "string") texts.push(part.text);
    const call = part.functionCall as { name?: string; args?: Record<string, unknown> } | undefined;
    if (call?.name) {
      n += 1;
      toolCalls.push({ id: `gem_${n}`, name: call.name, arguments: call.args ?? {} });
    }
  }
  return { text: texts.join(" ").trim(), toolCalls };
}

export function geminiAdapter(): { id: "gemini"; complete(input: CompleteInput): Promise<ModelTurn> } {
  return {
    id: "gemini",
    async complete(input) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not set. Pass --provider gemini only when that key is available. Ben chooses the provider.");
      }
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGeminiBody(input)),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 400)}`);
      }
      return parseGeminiTurn(await response.json());
    },
  };
}
