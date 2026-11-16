import { REQUIRED_TRANSITIONS } from "../states.js";
import type { CoverageRow, ScenarioResult, SuiteMetrics, SuiteResult, Transition } from "../types.js";

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sameEdge(left: Transition, right: { from: string; to: string; via?: string }): boolean {
  return left.from === right.from && left.to === right.to && (left.via ?? "") === (right.via ?? "");
}

export function summarise(input: {
  mode: "mock" | "live";
  provider: string;
  startedAt: string;
  scenarios: ScenarioResult[];
}): SuiteResult {
  const coverage = new Map<string, CoverageRow>();
  for (const scenario of input.scenarios) {
    for (const transition of scenario.transitions) {
      const key = `${transition.from}>${transition.to}>${transition.via ?? ""}`;
      const row = coverage.get(key) ?? { from: transition.from, to: transition.to, via: transition.via, count: 0 };
      row.count += 1;
      coverage.set(key, row);
    }
  }
  const rows = [...coverage.values()].sort((a, b) => b.count - a.count);
  const missingCoverage = REQUIRED_TRANSITIONS.filter((required) => !rows.some((row) => sameEdge(row, required)));
  const goalFive = input.scenarios.filter((scenario) => scenario.id && scenario.metrics.items >= 0 && scenario.set === "golden" && scenario.endReason !== undefined);
  const aimed = input.scenarios.filter((scenario) => scenario.checks.some((item) => item.id === "turn_budget"));
  const gaveUp = aimed.filter(
    (scenario) =>
      scenario.metrics.items < 5 &&
      !["kid_done", "silence", "time_budget", "low_battery", "safety", "upset", "unpaired"].includes(scenario.endReason ?? ""),
  );
  const metrics: SuiteMetrics = {
    scenarios: input.scenarios.length,
    passed: input.scenarios.filter((scenario) => scenario.passed).length,
    failed: input.scenarios.filter((scenario) => !scenario.passed).length,
    turnsPerItem: average(input.scenarios.map((scenario) => scenario.metrics.turnsPerItem).filter((value): value is number => value !== null)),
    questionsPerTurn: average(input.scenarios.map((scenario) => scenario.metrics.questionsPerTurn)) ?? 0,
    rejectionRate: average(input.scenarios.map((scenario) => scenario.metrics.rejectionRate).filter((value): value is number => value !== null)),
    giveUpRate: aimed.length ? gaveUp.length / aimed.length : 0,
    timeToFirstSuggestion: average(
      input.scenarios.map((scenario) => scenario.metrics.firstSuggestionTurn).filter((value): value is number => value !== null),
    ),
    assumptionErrors: input.scenarios.reduce((sum, scenario) => sum + scenario.metrics.assumptionErrors, 0),
    safetyFailures: input.scenarios.reduce((sum, scenario) => sum + scenario.checks.filter((item) => item.safety && !item.pass).length, 0),
  };
  void goalFive;
  const passed = metrics.failed === 0 && missingCoverage.length === 0;
  return { ...input, metrics, coverage: rows, missingCoverage, passed };
}
