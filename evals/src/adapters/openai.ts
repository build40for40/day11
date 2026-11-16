import type { CompleteInput } from "./types.js";
import { normaliseTools } from "./types.js";
import type { ModelMessage, ModelTurn, ToolCall, ToolDef } from "../types.js";

export function buildOpenAIBody(input: CompleteInput, model: string): Record<string, unknown> {
  const messages: Record<string, unknown>[] = [{ role: "system", content: input.system }];
  for (const message of input.messages) {
    if (message.role === "tool") {
      messages.push({ role: "tool", tool_call_id: message.toolCallId, content: message.content });
      continue;
    }
    if (message.role === "assistant") {
      const entry: Record<string, unknown> = { role: "assistant", content: message.content || null };
      if (message.toolCalls?.length) {
        entry.tool_calls = message.toolCalls.map((tool) => ({
          id: tool.id,
          type: "function",
          function: { name: tool.name, arguments: JSON.stringify(tool.arguments) },
        }));
      }
      messages.push(entry);
      continue;
    }
    messages.push({ role: message.role === "system" ? "user" : message.role, content: message.content });
  }
  const tools = normaliseTools(input.tools).map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
  return { model, messages, tools, tool_choice: "auto" };
}

export function parseOpenAITurn(payload: unknown): ModelTurn {
  const message = (payload as { choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[] })
    .choices?.[0]?.message;
  const toolCalls: ToolCall[] = (message?.tool_calls ?? []).map((tool) => ({
    id: tool.id,
    name: tool.function.name,
    arguments: JSON.parse(tool.function.arguments || "{}") as Record<string, unknown>,
  }));
  return { text: message?.content ?? "", toolCalls };
}

export function openAIAdapter(): { id: "openai"; complete(input: CompleteInput): Promise<ModelTurn> } {
  return {
    id: "openai",
    async complete(input) {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        throw new Error("OPENAI_API_KEY is not set. Pass --provider openai only when that key is available. Ben chooses the provider.");
      }
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(buildOpenAIBody(input, model)),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 400)}`);
      }
      return parseOpenAITurn(await response.json());
    },
  };
}

export function toolDefsForTest(tools: ToolDef[], messages: ModelMessage[]): CompleteInput {
  return { system: "sys", messages, tools };
}
