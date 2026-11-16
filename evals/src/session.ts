import type { Persona, Scenario, Session } from "./types.js";

export const DEFAULT_GROWNUP_LABEL = "your grown-up";
export const DEFAULT_HOLIDAY_MODE = "christmas" as const;

export function createSession(scenario: Scenario, persona: Persona): Session {
  const items = (scenario.priorItems ?? []).map((item) => ({
    item: item.item,
    reason: item.reason ?? "From an earlier chat.",
    kidId: persona.id,
    source: "voice" as const,
  }));
  return {
    kids: {
      [persona.id]: { id: persona.id, name: persona.name, items },
    },
    activeKidId: persona.id,
    nameKnown: Boolean(scenario.knownName) || scenario.start === "resume",
    acceptsItems: scenario.start !== "unknown_wand",
    noEmail: Boolean(scenario.noEmail),
    grownupLabel: scenario.grownupLabel ?? DEFAULT_GROWNUP_LABEL,
    holidayMode: scenario.holidayMode ?? DEFAULT_HOLIDAY_MODE,
    childAge: persona.age,
    ended: false,
    emails: [],
    safetyFlags: [],
    clips: [],
    elapsedSeconds: 0,
    clockFired: false,
    silenceStreak: 0,
  };
}
