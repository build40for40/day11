import type { Beat, Scenario, ScenarioExpect } from "../types.js";

type ScenarioDraft = Omit<Scenario, "tags"> & { tags?: string[] };

export function yesNo(lines: string[], yes = "Yes!"): Beat[] {
  return lines.flatMap((say) => [{ say }, { say: yes }]);
}

export function scenario(partial: ScenarioDraft): Scenario {
  return { ...partial, tags: partial.tags ?? [partial.set] };
}

export function five(partial: {
  id: string;
  title: string;
  personaId: string;
  beats: Beat[];
  knownName?: boolean;
  expect?: ScenarioExpect;
}): Scenario {
  const { expect, knownName, ...rest } = partial;
  return scenario({
    set: "golden",
    tags: ["golden"],
    goal: "five",
    knownName: knownName ?? true,
    checkTurnBudget: true,
    checkFirstSuggestion: true,
    ...rest,
    expect: { endReason: "complete", minItems: 5, maxItems: 5, delivery: "sent", ...expect },
  });
}
