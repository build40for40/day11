import type { Persona, Scenario, Session } from "./types.js";

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
    ended: false,
    emails: [],
    clips: [],
    elapsedSeconds: 0,
    clockFired: false,
    silenceStreak: 0,
  };
}
