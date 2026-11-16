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
  const body: Record<string, unknown> = { model, messages };
  if (tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  return body;
}

export interface OpenAIUsage {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  model: string;
}

const usage: OpenAIUsage = {
  requests: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cachedTokens: 0,
  model: "",
};

export function openAIUsage(): OpenAIUsage {
  return { ...usage };
}

export function resetOpenAIUsage(): void {
  usage.requests = 0;
  usage.promptTokens = 0;
  usage.completionTokens = 0;
  usage.totalTokens = 0;
  usage.cachedTokens = 0;
  usage.model = "";
}

const MODEL_RATES: Record<string, { input: number; cached: number; output: number }> = {
  "gpt-4.1": { input: 2, cached: 0.5, output: 8 },
  "gpt-4.1-mini": { input: 0.4, cached: 0.1, output: 1.6 },
  "gpt-4o": { input: 2.5, cached: 1.25, output: 10 },
  "gpt-4o-mini": { input: 0.15, cached: 0.075, output: 0.6 },
};

export function estimateOpenAICostUsd(stats: OpenAIUsage = usage): number | null {
  const key = Object.keys(MODEL_RATES).find((name) => stats.model === name || stats.model.startsWith(`${name}-20`));
  if (!key) return null;
  const rates = MODEL_RATES[key]!;
  const cached = stats.cachedTokens;
  const uncached = Math.max(0, stats.promptTokens - cached);
  return (uncached * rates.input + cached * rates.cached + stats.completionTokens * rates.output) / 1_000_000;
}

function recordUsage(payload: unknown, model: string): void {
  usage.model = model;
  usage.requests += 1;
  const recorded = (payload as {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      prompt_tokens_details?: { cached_tokens?: number };
    };
  }).usage;
  if (!recorded) return;
  usage.promptTokens += recorded.prompt_tokens ?? 0;
  usage.completionTokens += recorded.completion_tokens ?? 0;
  usage.totalTokens += recorded.total_tokens ?? 0;
  usage.cachedTokens += recorded.prompt_tokens_details?.cached_tokens ?? 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const body = JSON.stringify(buildOpenAIBody(input, model));
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body,
        });
        if (response.ok) {
          const payload: unknown = await response.json();
          recordUsage(payload, model);
          return parseOpenAITurn(payload);
        }
        const detail = await response.text();
        const billing = /insufficient_quota|credit_balance_exhausted|billing_not_active/.test(detail);
        const retryable = !billing && (response.status === 429 || response.status >= 500);
        lastError = new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 400)}`);
        if (!retryable || attempt === 4) throw lastError;
        const retryAfter = Number(response.headers.get("retry-after"));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 20000);
        await sleep(wait);
      }
      throw lastError ?? new Error("OpenAI request failed");
    },
  };
}

export function toolDefsForTest(tools: ToolDef[], messages: ModelMessage[]): CompleteInput {
  return { system: "sys", messages, tools };
}
