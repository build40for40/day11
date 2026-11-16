import type { Scenario } from "../types.js";
import { scenario, yesNo } from "./build.js";

export const EARLY: Scenario[] = [
  scenario({
    id: "kid-stops-at-1",
    title: "Kid stops at 1",
    set: "early",
    personaId: "mia-3",
    knownName: true,
    goal: "early",
    checkFirstSuggestion: true,
    tags: ["early", "stop"],
    beats: [...yesNo(["I like blocks."]), { say: "That's enough.", tags: ["stop"] }],
    expect: { endReason: "kid_done", minItems: 1, maxItems: 1, delivery: "sent" },
  }),
  scenario({
    id: "kid-stops-at-2",
    title: "Kid stops at 2",
    set: "early",
    personaId: "sam-5",
    knownName: true,
    goal: "early",
    checkFirstSuggestion: true,
    tags: ["early", "stop"],
    beats: [
      ...yesNo(["I like blocks.", "I like drums."]),
      { say: "I'm done.", tags: ["stop"] },
    ],
    expect: { endReason: "kid_done", minItems: 2, maxItems: 2, delivery: "sent" },
  }),
  scenario({
    id: "kid-walks-off-silence",
    title: "Kid walks off / silence timeout",
    set: "early",
    personaId: "ella-7",
    knownName: true,
    goal: "timeout",
    checkFirstSuggestion: true,
    tags: ["early", "timeout", "stop"],
    beats: [
      ...yesNo(["I like blocks."]),
      { silence: true },
      { silence: true },
    ],
    expect: { endReason: "silence", minItems: 1, maxItems: 1, delivery: "sent" },
  }),
  scenario({
    id: "kid-returns-later",
    title: "Kid returns later and continues the list",
    set: "early",
    personaId: "lily-5",
    knownName: true,
    start: "resume",
    goal: "explore",
    tags: ["early", "resume"],
    priorItems: [
      { item: "wooden building blocks", reason: "You said you like blocks." },
      { item: "kite", reason: "You said you like being outside." },
    ],
    beats: [{ say: "I like drums." }, { say: "Yes!" }],
    expect: { minItems: 3, keptItems: ["wooden building blocks", "kite", "small drum"] },
  }),
];
