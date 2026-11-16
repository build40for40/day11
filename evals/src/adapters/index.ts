import { geminiAdapter } from "./gemini.js";
import { openAIAdapter } from "./openai.js";
import type { ChatAdapter } from "./types.js";

export type ProviderName = "openai" | "gemini";

export function adapterFor(provider: ProviderName): ChatAdapter {
  if (provider === "openai") return openAIAdapter();
  if (provider === "gemini") return geminiAdapter();
  throw new Error(`Unknown provider ${provider}. Choose openai or gemini. Ben decides; neither is the default.`);
}

export function providerFromEnv(explicit?: string): ProviderName | undefined {
  const value = (explicit || process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (value === "openai" || value === "gemini") return value;
  return undefined;
}
