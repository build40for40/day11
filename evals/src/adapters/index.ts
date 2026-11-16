import { anthropicAdapter } from "./anthropic.js";
import { geminiAdapter } from "./gemini.js";
import { openAIAdapter } from "./openai.js";
import type { ChatAdapter } from "./types.js";

export type ProviderName = "openai" | "gemini" | "anthropic";

export function adapterFor(provider: ProviderName): ChatAdapter {
  if (provider === "openai") return openAIAdapter();
  if (provider === "gemini") return geminiAdapter();
  if (provider === "anthropic") return anthropicAdapter();
  throw new Error(`Unknown provider ${provider}. Choose openai, gemini, or anthropic.`);
}

export function providerFromEnv(explicit?: string): ProviderName | undefined {
  const value = (explicit || process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (value === "claude") return "anthropic";
  if (value === "openai" || value === "gemini" || value === "anthropic") return value;
  return undefined;
}
