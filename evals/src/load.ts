import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolDef } from "./types.js";

export function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "../..");
}

export function loadSystemPrompt(): string {
  const text = readFileSync(join(repoRoot(), "prompts/glisten.system.md"), "utf8").trim();
  if (!text.includes("Glisten")) {
    throw new Error("prompts/glisten.system.md does not look like the Glisten prompt");
  }
  return text;
}

export function loadTools(): ToolDef[] {
  const parsed = JSON.parse(readFileSync(join(repoRoot(), "prompts/tools.json"), "utf8")) as ToolDef[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("prompts/tools.json did not contain tool definitions");
  }
  return parsed;
}

export function loadRubric(): string {
  return readFileSync(join(repoRoot(), "evals/src/scoring/rubric.md"), "utf8");
}

export function renderSystemPrompt(
  base: string,
  values: { grownupLabel: string; holidayMode: string },
): string {
  return base.replaceAll("{grownup_label}", values.grownupLabel).replaceAll("{holiday_mode}", values.holidayMode);
}
