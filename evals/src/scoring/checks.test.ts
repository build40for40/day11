import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "../session.js";
import type { Scenario } from "../types.js";
import { evaluateChecks } from "./score.js";
import { personaById } from "../kid/personas.js";

const scenario = {
  id: "fixture",
  title: "fixture",
  set: "golden",
  tags: ["golden"],
  personaId: "mia-3",
  knownName: true,
  beats: [],
  goal: "explore",
} satisfies Scenario;

function input(transcript: Parameters<typeof evaluateChecks>[0]["transcript"], session = createSession(scenario, personaById("mia-3"))) {
  return {
    scenario,
    persona: personaById("mia-3"),
    session,
    transcript,
    transitions: [],
    mode: "mock" as const,
    system: "",
  };
}

describe("deterministic checks", () => {
  it("flags an add with no clear yes", () => {
    const session = createSession(scenario, personaById("mia-3"));
    session.kids["mia-3"]!.items.push({
      item: "kite",
      reason: "no",
      kidId: "mia-3",
      source: "voice",
    });
    const checks = evaluateChecks(
      input(
        [
          {
            role: "assistant",
            text: "Yes! The kite is going on your list.",
            toolCalls: [
              {
                id: "c1",
                name: "add_to_wishlist",
                arguments: { item: "kite" },
                result: { ok: true },
              },
            ],
          },
        ],
        session,
      ),
    );
    assert.equal(checks.find((item) => item.id === "clear_yes_before_add")?.pass, false);
  });

  it("accepts mmm no as not a yes and a later yes as a yes", () => {
    const session = createSession(scenario, personaById("mia-3"));
    session.kids["mia-3"]!.items.push({
      item: "magnifying glass",
      reason: "bugs",
      kidId: "mia-3",
      source: "voice",
    });
    const checks = evaluateChecks(
      input(
        [
          { role: "kid", text: "Mmm no." },
          { role: "assistant", text: "Would you like a magnifying glass to look at bugs and leaves?" },
          { role: "kid", text: "Yes!" },
          {
            role: "assistant",
            text: "Yes! The magnifying glass is going on your list. That's one.",
            toolCalls: [
              {
                id: "c1",
                name: "add_to_wishlist",
                arguments: { item: "magnifying glass" },
                result: { ok: true },
              },
            ],
          },
        ],
        session,
      ),
    );
    assert.equal(checks.find((item) => item.id === "clear_yes_before_add")?.pass, true);
    assert.equal(checks.find((item) => item.id === "confirmation_before_add")?.pass, true);
  });
});
