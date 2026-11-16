import { mockAuntyTurn } from "./adapters/mock-agent.js";
import type { ChatAdapter } from "./adapters/types.js";
import { liveKidLine } from "./kid/simulator.js";
import { personaById } from "./kid/personas.js";
import { loadSystemPrompt, loadTools, renderSystemPrompt } from "./load.js";
import { createSession } from "./session.js";
import { ASK_GROWNUP_CLIP, SESSION_LIMIT_SECONDS, SILENCE_LIMIT, SystemLines } from "./system-lines.js";
import { featuresFromTurn, stepState } from "./states.js";
import { activeItems, applyTool, workerFinish } from "./tools/handler.js";
import { brandsIn, neverSuggestReason } from "./tools/filter.js";
import type {
  Beat,
  ConvState,
  Episode,
  ModelMessage,
  Scenario,
  ScenarioResult,
  Session,
  TranscriptEntry,
  Transition,
} from "./types.js";
import {
  isAdult,
  isDisclosure,
  isImpossible,
  isInjection,
  isPersonal,
  isPrice,
  isRealQuestion,
  isRude,
  isSantaQuestion,
  isScary,
  isStop,
  isUpset,
} from "./text.js";
import { scoreScenario } from "./scoring/score.js";

export interface RunOptions {
  mode: "mock" | "live";
  provider: string;
  scenarios: Scenario[];
  adapter?: ChatAdapter;
}

function pushSystem(messages: ModelMessage[], transcript: TranscriptEntry[], text: string) {
  messages.push({ role: "user", content: `SYSTEM: ${text}` });
  transcript.push({ role: "system", text });
}

function stimulusFor(beat: Beat, say: string): string[] {
  const tags = new Set(beat.tags ?? []);
  if (isDisclosure(say)) tags.add("disclosure");
  if (isUpset(say)) tags.add("upset");
  if (isInjection(say)) tags.add("injection");
  if (isScary(say)) tags.add("violent");
  if (isAdult(say)) tags.add("adult");
  if (isRude(say)) tags.add("rude");
  if (isPersonal(say)) tags.add("personal");
  if (isPrice(say)) tags.add("price");
  if (isImpossible(say)) tags.add("impossible");
  if (neverSuggestReason(say)) tags.add("never-suggest");
  if (brandsIn(say).length || /\b(ipad|tablet|screen|tv|television)\b/i.test(say)) tags.add("brand");
  if (isStop(say)) tags.add("stop");
  if (isRealQuestion(say) || isSantaQuestion(say)) tags.add("magic");
  return [...tags];
}

async function agentTurn(input: {
  mode: "mock" | "live";
  adapter?: ChatAdapter;
  system: string;
  tools: ReturnType<typeof loadTools>;
  messages: ModelMessage[];
  transcript: TranscriptEntry[];
  session: Session;
  stimulus: string[];
  source: "voice" | "card";
  resting: ConvState;
  transitions: Transition[];
}): Promise<ConvState> {
  let resting = input.resting;
  for (let hop = 0; hop < 3 && !input.session.ended; hop += 1) {
    const turn =
      input.mode === "mock" || !input.adapter
        ? mockAuntyTurn(input.messages, input.session)
        : await input.adapter.complete({ system: input.system, messages: input.messages, tools: input.tools, purpose: "agent" });
    input.messages.push({ role: "assistant", content: turn.text, toolCalls: turn.toolCalls, providerBlocks: turn.providerBlocks });
    const executed = [];
    const side: TranscriptEntry[] = [];
    const systemNotes: string[] = [];
    for (const tool of turn.toolCalls) {
      const result = applyTool(input.session, tool, input.source, "model");
      executed.push({ ...tool, result });
      input.messages.push({
        role: "tool",
        toolCallId: tool.id,
        name: tool.name,
        content: JSON.stringify(result),
      });
      if (result.system) {
        systemNotes.push(result.system);
        side.push({ role: "system", text: result.system });
      }
      if (result.email) {
        side.push({
          role: "worker",
          text: `Emailed the grown-up only (${result.email.reason}, ${result.email.status}).`,
        });
      }
    }
    for (const note of systemNotes) {
      input.messages.push({ role: "user", content: `SYSTEM: ${note}` });
    }
    if (!input.session.ended && activeItems(input.session).length >= 5) {
      workerFinish(input.session, "complete");
    }
    const features = featuresFromTurn(turn.text, executed, hop === 0 ? input.stimulus : []);
    if (input.session.endReason === "complete") features.finishReason = "complete";
    const stepped = stepState(resting, features);
    resting = stepped.resting;
    input.transitions.push(...stepped.transitions);
    input.transcript.push({
      role: "assistant",
      text: turn.text,
      toolCalls: executed,
      tags: hop === 0 ? input.stimulus : [],
      state: resting,
      kidId: input.session.activeKidId,
    });
    input.transcript.push(...side);
    if (turn.text.trim() || turn.toolCalls.length === 0 || input.session.ended) break;
  }
  if (!input.session.ended && (input.session.silenceStreak >= SILENCE_LIMIT || input.session.clockFired)) {
    const reason = input.session.clockFired ? "time_budget" : "silence";
    const result = workerFinish(input.session, reason);
    if (result) {
      input.transcript.push({
        role: "worker",
        text: `Worker ended the session (${reason}).`,
        toolCalls: [
          {
            id: `worker_${reason}`,
            name: "finish_session",
            arguments: { reason },
            result,
          },
        ],
      });
      const stepped = stepState(resting, {
        greeting: false,
        warmup: false,
        suggestion: false,
        added: false,
        finishReason: reason,
        safety: false,
      });
      resting = stepped.resting;
      input.transitions.push(...stepped.transitions);
    }
  }
  return resting;
}

async function openAndPlay(input: {
  episode: Episode;
  scenario: Scenario;
  session: Session;
  messages: ModelMessage[];
  transcript: TranscriptEntry[];
  transitions: Transition[];
  resting: ConvState;
  mode: "mock" | "live";
  adapter?: ChatAdapter;
  system: string;
  tools: ReturnType<typeof loadTools>;
  personaName: string;
}): Promise<ConvState> {
  const start = input.episode.start ?? "wand";
  if (start === "unknown_wand") {
    input.session.acceptsItems = false;
    input.session.ended = true;
    input.session.endReason = "unpaired";
    input.session.endedBy = "worker";
    input.session.delivery = "none";
    input.session.clips.push(ASK_GROWNUP_CLIP);
    input.transcript.push({
      role: "worker",
      text: `play_local ${ASK_GROWNUP_CLIP}`,
      clip: ASK_GROWNUP_CLIP,
    });
    input.transcript.push({ role: "worker", text: "Unknown wand. Nothing saved." });
    return input.resting;
  }

  const kid = input.session.kids[input.session.activeKidId];
  if (start === "resume") {
    input.session.nameKnown = true;
    pushSystem(
      input.messages,
      input.transcript,
      SystemLines.resume(kid?.name ?? input.personaName, kid?.items.map((item) => item.item) ?? []),
    );
  } else {
    pushSystem(
      input.messages,
      input.transcript,
      SystemLines.wand(input.session.nameKnown ? kid?.name ?? input.personaName : undefined),
    );
  }
  if (input.session.noEmail) pushSystem(input.messages, input.transcript, SystemLines.noEmail(input.session.grownupLabel));
  pushSystem(
    input.messages,
    input.transcript,
    `Household settings: call the grown-up "${input.session.grownupLabel}". Holiday mode is ${input.session.holidayMode}. The child is ${input.session.childAge}.`,
  );
  let resting = await agentTurn({
    ...input,
    resting: input.resting,
    stimulus: [],
    source: "voice",
  });

  for (const beat of input.episode.beats) {
    if (input.session.ended) break;
    if (beat.disconnect) {
      input.transcript.push({ role: "worker", text: "Connection closed. Wishlist kept." });
      continue;
    }
    if (beat.simulatedDelayMs) {
      input.transcript.push({
        role: "worker",
        text: `Slow upstream ${beat.simulatedDelayMs} ms.`,
        simulatedDelayMs: beat.simulatedDelayMs,
      });
    }
    if (beat.advanceSeconds) input.session.elapsedSeconds += beat.advanceSeconds;
    if (beat.silence) {
      input.session.elapsedSeconds += 20;
      input.session.silenceStreak += 1;
      input.transcript.push({
        role: "kid",
        text: "",
        tags: ["silence", ...(beat.tags ?? [])],
        kidId: input.session.activeKidId,
      });
      pushSystem(
        input.messages,
        input.transcript,
        input.session.silenceStreak >= SILENCE_LIMIT ? SystemLines.silence : SystemLines.silenceNudge,
      );
    } else if (beat.say !== undefined) {
      input.session.elapsedSeconds += 15;
      input.session.silenceStreak = 0;
      let say = beat.say;
      if (input.mode === "live" && input.adapter) {
        const history = input.transcript
          .filter((entry) => entry.text && (entry.role === "assistant" || entry.role === "kid"))
          .map((entry) => `${entry.role === "assistant" ? "Glisten" : "Child"}: ${entry.text}`)
          .join("\n");
        const persona = personaById(input.scenario.personaId);
        say = await liveKidLine(input.adapter, persona, history, beat);
      }
      input.transcript.push({
        role: "kid",
        text: say,
        tags: beat.tags ?? [],
        kidId: input.session.activeKidId,
      });
      input.messages.push({ role: "user", content: say });
    }

    if (beat.rfid === "sibling_wand") {
      const id = beat.siblingId ?? "sibling";
      const name = beat.siblingName ?? "Sam";
      if (!input.session.kids[id]) input.session.kids[id] = { id, name, items: [] };
      input.session.activeKidId = id;
      input.session.nameKnown = true;
      pushSystem(input.messages, input.transcript, SystemLines.sibling(name, input.session.kids[id]!.items.length));
    } else if (beat.rfid === "unknown_wand") {
      input.session.clips.push(ASK_GROWNUP_CLIP);
      input.transcript.push({
        role: "worker",
        text: `play_local ${ASK_GROWNUP_CLIP}`,
        clip: ASK_GROWNUP_CLIP,
      });
      input.transcript.push({ role: "worker", text: "Unknown wand. Nothing saved." });
      continue;
    } else if (beat.rfid === "yes") pushSystem(input.messages, input.transcript, SystemLines.yes);
    else if (beat.rfid === "no") pushSystem(input.messages, input.transcript, SystemLines.no);
    else if (beat.rfid === "toy") pushSystem(input.messages, input.transcript, SystemLines.toy(beat.toyLabel ?? "wooden train set"));
    else if (beat.rfid === "resume") {
      const active = input.session.kids[input.session.activeKidId];
      pushSystem(
        input.messages,
        input.transcript,
        SystemLines.resume(active?.name ?? input.personaName, active?.items.map((item) => item.item) ?? []),
      );
    }

    const tags = new Set(beat.tags ?? []);
    if (tags.has("misheard")) pushSystem(input.messages, input.transcript, SystemLines.misheard);
    if (tags.has("background")) pushSystem(input.messages, input.transcript, SystemLines.background);
    if (tags.has("two-voices") || tags.has("two_voices")) pushSystem(input.messages, input.transcript, SystemLines.twoVoices);
    if (tags.has("slow")) pushSystem(input.messages, input.transcript, SystemLines.slow);

    if (input.session.elapsedSeconds >= SESSION_LIMIT_SECONDS && !input.session.clockFired) {
      input.session.clockFired = true;
      pushSystem(input.messages, input.transcript, SystemLines.fiveMin);
    }

    const say = beat.say ?? "";
    resting = await agentTurn({
      mode: input.mode,
      adapter: input.adapter,
      system: input.system,
      tools: input.tools,
      messages: input.messages,
      transcript: input.transcript,
      session: input.session,
      stimulus: stimulusFor(beat, beat.silence ? "" : say),
      source: beat.rfid === "yes" ? "card" : "voice",
      resting,
      transitions: input.transitions,
    });
  }
  return resting;
}

export async function runScenario(scenario: Scenario, options: Omit<RunOptions, "scenarios"> & {
  system: string;
  tools: ReturnType<typeof loadTools>;
}): Promise<ScenarioResult> {
  const persona = personaById(scenario.personaId);
  const session = createSession(scenario, persona);
  const system = renderSystemPrompt(options.system, {
    grownupLabel: session.grownupLabel,
    holidayMode: session.holidayMode,
  });
  const transcript: TranscriptEntry[] = [];
  const transitions: Transition[] = [];
  const messages: ModelMessage[] = [];
  const episodes: Episode[] = scenario.episodes ?? [
    { start: scenario.start, knownName: scenario.knownName, beats: scenario.beats },
  ];
  let resting: ConvState = "greet";
  for (let index = 0; index < episodes.length; index += 1) {
    if (index > 0) {
      session.ended = false;
      session.endReason = undefined;
      session.endDetail = undefined;
      session.silenceStreak = 0;
      resting = "greet";
      messages.length = 0;
      transcript.push({ role: "worker", text: "A later session starts." });
    }
    const episode = episodes[index]!;
    if (episode.knownName) session.nameKnown = true;
    resting = await openAndPlay({
      episode,
      scenario,
      session,
      messages,
      transcript,
      transitions,
      resting,
      mode: options.mode,
      adapter: options.adapter,
      system,
      tools: options.tools,
      personaName: persona.name,
    });
  }
  return scoreScenario({
    scenario,
    persona,
    session,
    transcript,
    transitions,
    mode: options.mode,
    adapter: options.adapter,
    system,
  });
}

export async function runSuite(options: RunOptions): Promise<import("./types.js").SuiteResult> {
  const system = loadSystemPrompt();
  const tools = loadTools();
  const startedAt = new Date().toISOString();
  const scenarios = [];
  for (const scenario of options.scenarios) {
    const index = scenarios.length + 1;
    const started = Date.now();
    try {
      const result = await runScenario(scenario, { ...options, system, tools });
      const seconds = Math.round((Date.now() - started) / 1000);
      console.log(`${index}/${options.scenarios.length} ${result.id} ${result.passed ? "pass" : "fail"} (${seconds}s)`);
      scenarios.push(result);
    } catch (error) {
      const seconds = Math.round((Date.now() - started) / 1000);
      const message = error instanceof Error ? error.message : String(error);
      console.log(`${index}/${options.scenarios.length} ${scenario.id} error (${seconds}s): ${message}`);
      const failed: ScenarioResult = {
        id: scenario.id,
        title: scenario.title,
        set: scenario.set,
        personaId: scenario.personaId,
        passed: false,
        checks: [{ id: "run_error", pass: false, detail: message, safety: false }],
        wishlist: {},
        activeKidId: scenario.personaId,
        emails: [],
        clips: [],
        transitions: [],
        states: ["greet"],
        transcript: [],
        judge: { mode: "heuristic", scores: { warmth: null, oneIdea: null, grounded: null, noStereotype: null, frustration: null, yesToEverything: null, noPromises: null, gentleRedirect: null, magic: null, upset: null, earlyFinish: null, injection: null, safetyEscalation: null, siblingSwitch: null }, notes: message, assumptionErrors: 0 },
        parent: { mode: "heuristic", wouldBuy: null, plasticTat: false, matchesKid: true, notes: message },
        metrics: {
          kidTurns: 0,
          agentTurns: 0,
          items: 0,
          turnsPerItem: null,
          questionsPerTurn: 0,
          suggestions: 0,
          rejections: 0,
          rejectionRate: null,
          firstSuggestionTurn: null,
          assumptionErrors: 0,
        },
      };
      scenarios.push(failed);
    }
  }
  const { summarise } = await import("./scoring/summary.js");
  return summarise({ mode: options.mode, provider: options.provider, startedAt, scenarios });
}
