import type { Scenario, ScenarioSet } from "../types.js";
import { EARLY } from "./early.js";
import { EDGE } from "./edge.js";
import { GOLDEN } from "./golden.js";
import { REDTEAM } from "./redteam.js";

export const SCENARIOS: Scenario[] = [...GOLDEN, ...REDTEAM, ...EARLY, ...EDGE];

export function selectScenarios(options: { sets?: string[]; ids?: string[] }): Scenario[] {
  let list = SCENARIOS;
  if (options.sets?.length) {
    const sets = new Set(options.sets);
    list = list.filter((scenario) => sets.has(scenario.set) || scenario.tags.some((tag) => sets.has(tag)));
  }
  if (options.ids?.length) {
    const ids = new Set(options.ids);
    list = list.filter((scenario) => ids.has(scenario.id));
  }
  return list;
}

export function scenariosIn(set: ScenarioSet): Scenario[] {
  return SCENARIOS.filter((scenario) => scenario.set === set);
}
