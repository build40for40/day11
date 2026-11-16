import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ScenarioResult, SuiteResult } from "./types.js";

function pct(value: number | null): string {
  if (value === null) return "n/a";
  return `${Math.round(value * 1000) / 10}%`;
}

function num(value: number | null): string {
  if (value === null) return "n/a";
  return (Math.round(value * 100) / 100).toString();
}

function failedChecks(scenario: ScenarioResult): string {
  const failed = scenario.checks.filter((item) => !item.pass);
  if (!failed.length) return "";
  return failed.map((item) => `${item.id}: ${item.detail}`).join("<br>");
}

export function renderMarkdown(result: SuiteResult): string {
  const lines = [
    "# Glisten eval report",
    "",
    `Mode **${result.mode}** with provider **${result.provider}**. Started ${result.startedAt}.`,
    "",
    result.passed ? "All hard checks passed, and the state graph includes the stop and timeout edges." : "Some hard checks failed, or a required state transition was missing.",
    "",
    "## Metrics",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Scenarios | ${result.metrics.passed}/${result.metrics.scenarios} passed |`,
    `| Turns per item | ${num(result.metrics.turnsPerItem)} |`,
    `| Questions per turn | ${num(result.metrics.questionsPerTurn)} |`,
    `| Rejection rate | ${pct(result.metrics.rejectionRate)} |`,
    `| Give-up rate | ${pct(result.metrics.giveUpRate)} |`,
    `| Time to first suggestion | ${num(result.metrics.timeToFirstSuggestion)} agent turns |`,
    `| Assumption errors | ${result.metrics.assumptionErrors} |`,
    `| Safety failures | ${result.metrics.safetyFailures} |`,
    "",
    "## State coverage",
    "",
    "| From | To | Via | Runs |",
    "| --- | --- | --- | --- |",
    ...result.coverage.map((row) => `| ${row.from} | ${row.to} | ${row.via ?? ""} | ${row.count} |`),
    "",
  ];
  if (result.missingCoverage.length) {
    lines.push("Missing required transitions:", "");
    for (const row of result.missingCoverage) lines.push(`- ${row.from} → ${row.to}${row.via ? ` via ${row.via}` : ""}`);
    lines.push("");
  } else {
    lines.push("Required edges are present, including discovery → recap via stop and via timeout.", "");
  }
  lines.push("## Scenarios", "", "| Id | Set | Result | Items | End | Failed checks |", "| --- | --- | --- | --- | --- | --- |");
  for (const scenario of result.scenarios) {
    lines.push(
      `| ${scenario.id} | ${scenario.set} | ${scenario.passed ? "pass" : "fail"} | ${scenario.metrics.items} | ${scenario.endReason ?? ""} | ${failedChecks(scenario)} |`,
    );
  }
  lines.push("", "Mock mode uses scripted children and a scripted Glisten. It checks the harness, the worker rules, and that the prompt file still contains the rules. It does not prove a live model will comply. Run with `--provider openai`, `--provider gemini`, or `--provider anthropic` for that.");
  lines.push("");
  return lines.join("\n");
}

export function writeReport(result: SuiteResult, directory: string): void {
  mkdirSync(directory, { recursive: true });
  mkdirSync(join(directory, "transcripts"), { recursive: true });
  writeFileSync(join(directory, "summary.md"), renderMarkdown(result));
  writeFileSync(join(directory, "summary.json"), JSON.stringify(result, null, 2));
  for (const scenario of result.scenarios) {
    writeFileSync(join(directory, "transcripts", `${scenario.id}.json`), JSON.stringify(scenario, null, 2));
    const lines = [`# ${scenario.title}`, "", `Result: ${scenario.passed ? "pass" : "fail"}`, ""];
    for (const entry of scenario.transcript) {
      const tools = entry.toolCalls?.map((tool) => `${tool.name}(${JSON.stringify(tool.arguments)})`).join(", ");
      lines.push(`**${entry.role}**${entry.tags?.length ? ` [${entry.tags.join(", ")}]` : ""}`);
      if (entry.text) lines.push(entry.text);
      if (tools) lines.push(`Tools: ${tools}`);
      lines.push("");
    }
    writeFileSync(join(directory, "transcripts", `${scenario.id}.md`), lines.join("\n"));
  }
}
