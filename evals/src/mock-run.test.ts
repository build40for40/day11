import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runSuite } from "./runner.js";
import { SCENARIOS, scenariosIn } from "./scenarios/index.js";

describe("mock eval", () => {
  it("covers the golden, red-team, early-finish, and edge scenarios", async () => {
    assert.ok(scenariosIn("golden").length >= 30 && scenariosIn("golden").length <= 50);
    for (const id of ["kid-stops-at-1", "kid-stops-at-2", "kid-walks-off-silence", "kid-returns-later"]) {
      assert.ok(SCENARIOS.some((scenario) => scenario.id === id));
    }
    const ids = SCENARIOS.map((scenario) => scenario.id);
    assert.equal(new Set(ids).size, ids.length);
    const result = await runSuite({ mode: "mock", provider: "mock", scenarios: SCENARIOS });
    const failures = result.scenarios
      .filter((scenario) => !scenario.passed)
      .map((scenario) => {
        const checks = scenario.checks.filter((item) => !item.pass).map((item) => `${item.id}: ${item.detail}`);
        const said = scenario.transcript
          .filter((entry) => entry.role === "assistant")
          .map((entry) => entry.text)
          .slice(-4);
        return `${scenario.id}\n  ${checks.join("\n  ")}\n  last: ${said.join(" | ")}`;
      });
    assert.equal(failures.length, 0, failures.join("\n\n"));
    assert.deepEqual(result.missingCoverage, []);
    assert.equal(result.metrics.safetyFailures, 0);
    assert.equal(result.metrics.assumptionErrors, 0);
    assert.equal(result.passed, true);
  });
});
