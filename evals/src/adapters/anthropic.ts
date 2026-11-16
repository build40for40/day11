import type { AdapterPurpose, CompleteInput } from "./types.js";
import { normaliseTools } from "./types.js";
import type { ModelMessage, ModelTurn, ToolCall, ToolDef } from "../types.js";

const ANTHROPIC_VERSION = "2023-06-01";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const DEFAULT_AGENT_MODEL = "claude-sonnet-5-5";
const DEFAULT_KID_MODEL = "claude-haiku-5-5";
const DEFAULT_JUDGE_MODEL = "claude-sonnet-5-5";

type ContentBlock = Record<string, unknown>;

export interface AnthropicModelUsage {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export interface AnthropicUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  byModel: Record<string, AnthropicModelUsage>;
}

const usage: AnthropicUsage = {
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  byModel: {},
};

export function anthropicUsage(): AnthropicUsage {
  return {
    ...usage,
    byModel: Object.fromEntries(Object.entries(usage.byModel).map(([key, value]) => [key, { ...value }])),
  };
}

export function resetAnthropicUsage(): void {
  usage.requests = 0;
  usage.inputTokens = 0;
  usage.outputTokens = 0;
  usage.cacheReadTokens = 0;
  usage.cacheCreationTokens = 0;
  usage.byModel = {};
}

/** USD per million tokens. Haiku 5.5 rates are the <=100k prompt band. */
const MODEL_RATES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
};

function ratesFor(model: string) {
  const exact = MODEL_RATES[model];
  if (exact) return exact;
  const key = Object.keys(MODEL_RATES).find((name) => model === name || model.startsWith(`${name}-`));
  return key ? MODEL_RATES[key] : null;
}

export function estimateAnthropicCostUsd(stats: AnthropicUsage = usage): number | null {
  let total = 0;
  let known = false;
  const rows = Object.values(stats.byModel);
  const fallback = rows.length ? rows : [{ model: "", ...stats, requests: stats.requests }];
  for (const row of fallback) {
    const rates = ratesFor(row.model);
    if (!rates) continue;
    known = true;
    total +=
      (row.inputTokens * rates.input +
        row.outputTokens * rates.output +
        row.cacheReadTokens * rates.cacheRead +
        row.cacheCreationTokens * rates.cacheWrite) /
      1_000_000;
  }
  return known ? total : null;
}

export function modelForPurpose(purpose: AdapterPurpose = "agent"): string {
  const fallback = process.env.ANTHROPIC_MODEL?.trim();
  if (purpose === "kid") {
    return process.env.ANTHROPIC_KID_MODEL?.trim() || fallback || DEFAULT_KID_MODEL;
  }
  if (purpose === "judge") {
    return process.env.ANTHROPIC_JUDGE_MODEL?.trim() || fallback || DEFAULT_JUDGE_MODEL;
  }
  return process.env.ANTHROPIC_AGENT_MODEL?.trim() || fallback || DEFAULT_AGENT_MODEL;
}

function maxTokensFor(purpose: AdapterPurpose): number {
  if (purpose === "kid") return 512;
  if (purpose === "judge") return 2048;
  return 2048;
}

function thinkingFor(model: string): Record<string, unknown> {
  if (model.includes("sonnet-5-5")) return { type: "between_tools" };
  if (model.includes("haiku-5-5") || model.includes("haiku-4-5")) return { type: "disabled" };
  return { type: "disabled" };
}

function effortFor(purpose: AdapterPurpose): string {
  if (purpose === "kid") return "low";
  return "medium";
}

function asContentArray(content: unknown): ContentBlock[] {
  if (Array.isArray(content)) return content as ContentBlock[];
  if (typeof content === "string") return content ? [{ type: "text", text: content }] : [];
  return [];
}

function appendUserText(messages: Record<string, unknown>[], text: string) {
  if (!text) return;
  const last = messages.at(-1);
  if (last?.role === "user") {
    const blocks = asContentArray(last.content);
    blocks.push({ type: "text", text });
    last.content = blocks;
    return;
  }
  messages.push({ role: "user", content: text });
}

function appendToolResult(messages: Record<string, unknown>[], block: ContentBlock) {
  const last = messages.at(-1);
  if (last?.role === "user") {
    const blocks = asContentArray(last.content);
    blocks.push(block);
    last.content = blocks;
    return;
  }
  messages.push({ role: "user", content: [block] });
}

export function normalizeAnthropicMessages(messages: Record<string, unknown>[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  let index = 0;
  while (index < messages.length) {
    const message = messages[index]!;
    if (message.role !== "assistant") {
      out.push(message);
      index += 1;
      continue;
    }
    out.push(message);
    const ids = asContentArray(message.content)
      .filter((block) => block.type === "tool_use" && typeof block.id === "string")
      .map((block) => block.id as string);
    if (!ids.length) {
      index += 1;
      continue;
    }
    const results = new Map<string, ContentBlock>();
    const extra: ContentBlock[] = [];
    let next = index + 1;
    while (next < messages.length && messages[next]?.role === "user") {
      for (const block of asContentArray(messages[next]!.content)) {
        if (block.type === "tool_result" && typeof block.tool_use_id === "string") {
          results.set(block.tool_use_id, block);
        } else {
          extra.push(block);
        }
      }
      next += 1;
    }
    const blocks: ContentBlock[] = ids.map(
      (id) =>
        results.get(id) ?? {
          type: "tool_result",
          tool_use_id: id,
          content: "Tool did not run.",
          is_error: true,
        },
    );
    for (const [id, block] of results) {
      if (!ids.includes(id)) blocks.push(block);
    }
    blocks.push(...extra);
    out.push({ role: "user", content: blocks });
    index = next;
  }
  return out;
}

export function buildAnthropicBody(input: CompleteInput, model: string): Record<string, unknown> {
  const purpose = input.purpose ?? "agent";
  const messages: Record<string, unknown>[] = [];
  for (const message of input.messages) {
    if (message.role === "tool") {
      appendToolResult(messages, {
        type: "tool_result",
        tool_use_id: message.toolCallId,
        content: message.content || "",
      });
      continue;
    }
    if (message.role === "assistant") {
      const content = message.providerBlocks
        ? (message.providerBlocks as ContentBlock[])
        : (() => {
            const blocks: ContentBlock[] = [];
            if (message.content.trim()) blocks.push({ type: "text", text: message.content });
            for (const tool of message.toolCalls ?? []) {
              blocks.push({ type: "tool_use", id: tool.id, name: tool.name, input: tool.arguments ?? {} });
            }
            return blocks.length ? blocks : [{ type: "text", text: "" }];
          })();
      messages.push({ role: "assistant", content });
      continue;
    }
    appendUserText(messages, message.content);
  }
  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokensFor(purpose),
    system: input.system,
    messages: normalizeAnthropicMessages(messages),
    thinking: thinkingFor(model),
    output_config: { effort: effortFor(purpose) },
  };
  const tools = normaliseTools(input.tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters ?? { type: "object", properties: {} },
  }));
  if (tools.length) body.tools = tools;
  return body;
}

export function parseAnthropicTurn(payload: unknown): ModelTurn {
  const content = ((payload as { content?: ContentBlock[] }).content ?? []) as ContentBlock[];
  const texts: string[] = [];
  const toolCalls: ToolCall[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") texts.push(block.text);
    if (block.type === "tool_use" && typeof block.name === "string") {
      const args = block.input;
      toolCalls.push({
        id: typeof block.id === "string" ? block.id : `tool_${toolCalls.length + 1}`,
        name: block.name,
        arguments: args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {},
      });
    }
  }
  return { text: texts.join(" ").trim(), toolCalls, providerBlocks: content };
}

function recordUsage(payload: unknown, model: string): void {
  const recorded = (payload as {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  }).usage;
  const inputTokens = recorded?.input_tokens ?? 0;
  const outputTokens = recorded?.output_tokens ?? 0;
  const cacheReadTokens = recorded?.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = recorded?.cache_creation_input_tokens ?? 0;
  usage.requests += 1;
  usage.inputTokens += inputTokens;
  usage.outputTokens += outputTokens;
  usage.cacheReadTokens += cacheReadTokens;
  usage.cacheCreationTokens += cacheCreationTokens;
  const row = usage.byModel[model] ?? {
    model,
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };
  row.requests += 1;
  row.inputTokens += inputTokens;
  row.outputTokens += outputTokens;
  row.cacheReadTokens += cacheReadTokens;
  row.cacheCreationTokens += cacheCreationTokens;
  usage.byModel[model] = row;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function anthropicAdapter(): { id: "anthropic"; complete(input: CompleteInput): Promise<ModelTurn> } {
  return {
    id: "anthropic",
    async complete(input) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error("ANTHROPIC_API_KEY is not set. Pass --provider anthropic only when that key is available.");
      }
      const model = modelForPurpose(input.purpose);
      const body = JSON.stringify(buildAnthropicBody(input, model));
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: {
              "x-api-key": key,
              "anthropic-version": ANTHROPIC_VERSION,
              "content-type": "application/json",
            },
            body,
          });
          if (response.ok) {
            const payload: unknown = await response.json();
            recordUsage(payload, model);
            return parseAnthropicTurn(payload);
          }
          const detail = await response.text();
          if (response.status === 400) {
            try {
              const { writeFileSync } = await import("node:fs");
              writeFileSync("/tmp/anthropic-last-400.json", JSON.stringify({ status: 400, detail: detail.slice(0, 2000), body: JSON.parse(body) }, null, 2));
            } catch {
              // ignore debug write failures
            }
          }
          const billing = /insufficient_quota|credit_balance_exhausted|billing_not_active|credit balance|purchase credits/i.test(
            detail,
          );
          const retryable = !billing && (response.status === 429 || response.status === 529 || response.status >= 500);
          lastError = new Error(`Anthropic request failed (${response.status}): ${detail.slice(0, 400)}`);
          if (!retryable || attempt === 4) throw lastError;
          const retryAfter = Number(response.headers.get("retry-after"));
          const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(1000 * 2 ** attempt, 20000);
          await sleep(wait);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const network = /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|network|socket/i.test(message);
          if (!network || attempt === 4) throw error;
          lastError = error instanceof Error ? error : new Error(message);
          await sleep(Math.min(1000 * 2 ** attempt, 20000));
        }
      }
      throw lastError ?? new Error("Anthropic request failed");
    },
  };
}

export function toolDefsForTest(tools: ToolDef[], messages: ModelMessage[]): CompleteInput {
  return { system: "sys", messages, tools };
}
