import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { adapterFor, providerFromEnv, type ProviderName } from "./adapters/index.js";
import { repoRoot } from "./load.js";
import { writeReport, renderMarkdown } from "./report.js";
import { runSuite } from "./runner.js";
import { SCENARIOS, selectScenarios } from "./scenarios/index.js";

function readArgs(argv: string[]) {
  const sets: string[] = [];
  const ids: string[] = [];
  let mock = false;
  let provider: string | undefined;
  let out: string | undefined;
  let list = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mock") mock = true;
    else if (arg === "--list") list = true;
    else if (arg === "--provider") provider = argv[++index];
    else if (arg === "--set") sets.push(...(argv[++index] ?? "").split(",").filter(Boolean));
    else if (arg === "--scenario") ids.push(...(argv[++index] ?? "").split(",").filter(Boolean));
    else if (arg === "--out") out = argv[++index];
    else if (arg === "--help") {
      console.log(`Usage: npm run eval -- --mock [--set golden,redteam,early,edge] [--scenario id] [--out dir]
       npm run eval -- --provider openai|gemini

Ben chooses the provider. There is no default. Keys: OPENAI_API_KEY, GEMINI_API_KEY.
Optional model names: OPENAI_MODEL, GEMINI_MODEL.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${arg}`);
    }
  }
  return { mock, provider, sets, ids, out, list };
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.list) {
    for (const scenario of SCENARIOS) console.log(`${scenario.set}\t${scenario.id}\t${scenario.title}`);
    return;
  }
  const scenarios = selectScenarios({ sets: args.sets, ids: args.ids });
  if (!scenarios.length) throw new Error("No scenarios matched.");
  const chosen = providerFromEnv(args.provider);
  if (!args.mock && !chosen) {
    throw new Error("Choose a provider with --provider openai or --provider gemini, or set LLM_PROVIDER. Ben decides. Use --mock to run with no API keys.");
  }
  const provider: ProviderName | "mock" = args.mock ? "mock" : (chosen as ProviderName);
  const result = await runSuite({
    mode: args.mock ? "mock" : "live",
    provider,
    scenarios,
    adapter: args.mock ? undefined : adapterFor(provider as ProviderName),
  });
  const out = args.out ?? join(repoRoot(), "evals/out", result.startedAt.replace(/[:.]/g, "-"));
  mkdirSync(out, { recursive: true });
  writeReport(result, out);
  console.log(renderMarkdown(result));
  console.log(`Wrote ${out}`);
  if (!result.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
