export const NAME_MAX = 40;
export const PROFILE_MAX = 300;
export const MEMORY_LINE_MAX = 200;
export const MEMORY_MAX = 1200;

export type WandRecord = { name: string; profile: string; memory: string };

export function oneLine(text: string, max: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max).trim();
}

function capped(lines: string[]): string {
  const kept = [...lines];
  while (kept.length > 1 && kept.join("\n").length > MEMORY_MAX) kept.shift();
  return kept.join("\n").slice(0, MEMORY_MAX);
}

function cleanLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => oneLine(line, MEMORY_LINE_MAX))
    .filter(Boolean);
}

export function addMemoryLine(memory: string, line: string): string {
  const lines = cleanLines(memory);
  const added = oneLine(line, MEMORY_LINE_MAX);
  if (!added || lines.includes(added)) return capped(lines);
  return capped([...lines, added]);
}

export function rewriteMemory(text: string): string {
  return capped(cleanLines(text));
}
