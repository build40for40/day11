import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PERSONAS, wordsPerTurn } from "./personas.js";
import { kidSystemPrompt } from "./simulator.js";

describe("CHILDES turn length", () => {
  it("uses the shy and chatty ends of each age band", () => {
    for (const persona of PERSONAS) {
      const band = wordsPerTurn(persona);
      if (persona.age === 3) assert.deepEqual([band.low, band.high], [2.5, 2.8]);
      if (persona.age === 5) assert.deepEqual([band.low, band.high], [3.1, 3.8]);
      if (persona.age === 7) {
        assert.ok(band.low >= 4 && band.low <= 4.3);
        assert.ok(band.high >= 4.3 && band.high <= 4.7);
      }
      const prompt = kidSystemPrompt(persona);
      assert.match(prompt, /2\.5 to 2\.8/);
      assert.match(prompt, /3\.1 to 3\.8/);
      assert.match(prompt, /about 4\.3/);
      if (persona.sociability === "shy") assert.match(prompt, /shy end/);
      if (persona.sociability === "chatty") assert.match(prompt, /chatty end/);
    }
  });
});
