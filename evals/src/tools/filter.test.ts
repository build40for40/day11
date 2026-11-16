import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSession } from "../session.js";
import type { Scenario } from "../types.js";
import { filterItemAndReason } from "./filter.js";
import { applyTool } from "./handler.js";

const scenario = {
  id: "t",
  title: "t",
  set: "golden",
  tags: [],
  personaId: "mia-3",
  beats: [],
} satisfies Scenario;

function session() {
  return createSession(scenario, {
    id: "mia-3",
    name: "Mia",
    age: 3,
    sociability: "shy",
    decisiveness: "decisive",
    attention: "short",
    interests: ["blocks"],
    quirks: ["none"],
  });
}

describe("item filter", () => {
  it("accepts a plain toy", () => {
    assert.equal(filterItemAndReason("wooden building blocks", "You said you like blocks."), undefined);
  });

  it("rejects brands, prices, violence, urls, and length", () => {
    assert.match(filterItemAndReason("a Lego set") ?? "", /brand/i);
    assert.match(filterItemAndReason("a £10 kite") ?? "", /price/i);
    assert.match(filterItemAndReason("a toy gun") ?? "", /gun/i);
    assert.match(filterItemAndReason("see https://shop.example/toy") ?? "", /url/i);
    assert.match(filterItemAndReason("x".repeat(81)) ?? "", /longer/i);
  });
});

describe("wishlist handler", () => {
  it("caps at 5, merges duplicates, and removes", () => {
    const state = session();
    for (let i = 0; i < 5; i += 1) {
      const result = applyTool(state, {
        id: `a${i}`,
        name: "add_to_wishlist",
        arguments: { item: `toy ${i}`, reason: "They said yes." },
      });
      assert.equal(result.ok, true);
      assert.equal(result.count, i + 1);
    }
    const sixth = applyTool(state, {
      id: "a6",
      name: "add_to_wishlist",
      arguments: { item: "toy extra" },
    });
    assert.equal(sixth.ok, false);
    assert.equal(sixth.error, "cap");
    const dup = applyTool(state, {
      id: "dup",
      name: "add_to_wishlist",
      arguments: { item: "Toy 1" },
    });
    assert.equal(dup.merged, true);
    assert.equal(state.kids["mia-3"]!.items.length, 5);
    const removed = applyTool(state, {
      id: "rm",
      name: "remove_from_wishlist",
      arguments: { item: "toy 1" },
    });
    assert.equal(removed.removed, true);
    assert.equal(state.kids["mia-3"]!.items.some((item) => item.item === "toy 1"), false);
  });

  it("rejects a filtered add and emails only Mum on safety", () => {
    const state = session();
    const blocked = applyTool(state, {
      id: "bad",
      name: "add_to_wishlist",
      arguments: { item: "iPad" },
    });
    assert.equal(blocked.ok, false);
    assert.equal(state.kids["mia-3"]!.items.length, 0);
    const safety = applyTool(state, {
      id: "end",
      name: "finish_session",
      arguments: { reason: "safety", detail: "worrying disclosure" },
    });
    assert.equal(safety.ok, true);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0]!.to, "mum");
    assert.equal(state.emails[0]!.reason, "safety");
    assert.equal(state.endReason, "safety");
  });
});
