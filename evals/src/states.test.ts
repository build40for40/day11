import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { featuresFromTurn, stepState } from "./states.js";
import type { ConvState, Transition } from "./types.js";

describe("conversation states", () => {
  it("walks greet to a finished list and a stop", () => {
    let state: ConvState = "greet";
    const seen: Transition[] = [];
    const turn = (text: string, tools: { name: string; reason?: string; duplicate?: boolean }[] = [], stimulus: string[] = []) => {
      const executed = tools.map((tool, index) => ({
        id: `c${index}`,
        name: tool.name,
        arguments: tool.reason ? { reason: tool.reason } : { item: "kite" },
        result: { ok: true, duplicate: tool.duplicate },
      }));
      const features = featuresFromTurn(text, executed, stimulus);
      const next = stepState(state, features);
      state = next.resting;
      seen.push(...next.transitions);
    };

    turn("Oh! Hello Lily! I'm Glisten. What's the best thing you've played with lately?");
    turn("Would you like wooden building blocks you can build a castle with?");
    turn("Yes! Wooden building blocks is going on your list. That's one. What else do you love doing?", [
      { name: "add_to_wishlist" },
    ]);
    turn("Yes! A kite is going on your list. That's five. We did it!", [
      { name: "add_to_wishlist" },
      { name: "finish_session", reason: "complete" },
    ]);

    assert.ok(seen.some((edge) => edge.from === "greet" && edge.to === "warm-up"));
    assert.ok(seen.some((edge) => edge.from === "warm-up" && edge.to === "discovery"));
    assert.ok(seen.some((edge) => edge.from === "discovery" && edge.to === "add"));
    assert.ok(seen.some((edge) => edge.from === "add" && edge.to === "discovery"));
    assert.ok(seen.some((edge) => edge.from === "add" && edge.to === "recap" && edge.via === "complete"));

    state = "discovery";
    const stop = stepState(state, {
      greeting: false,
      warmup: false,
      suggestion: false,
      added: false,
      finishReason: "kid_done",
      safety: false,
    });
    assert.deepEqual(stop.transitions, [{ from: "discovery", to: "recap", via: "stop" }]);

    const timeout = stepState("discovery", {
      greeting: false,
      warmup: false,
      suggestion: false,
      added: false,
      finishReason: "silence",
      safety: false,
    });
    assert.equal(timeout.transitions[0]?.via, "timeout");

    const safety = stepState("discovery", {
      greeting: false,
      warmup: false,
      suggestion: false,
      added: false,
      finishReason: "safety",
      safety: true,
    });
    assert.equal(safety.resting, "safety");
  });
});
