import type { ConvState, ExecutedTool, Transition } from "./types.js";

export interface TurnFeatures {
  greeting: boolean;
  warmup: boolean;
  suggestion: boolean;
  added: boolean;
  finishReason?: string;
  safety: boolean;
}

export function featuresFromTurn(text: string, tools: ExecutedTool[], stimulus: string[]): TurnFeatures {
  const finish = tools.find((tool) => tool.name === "finish_session" && tool.result.ok);
  const added = tools.some(
    (tool) => tool.name === "add_to_wishlist" && tool.result.ok && !tool.result.duplicate,
  );
  const finishReason = typeof finish?.arguments.reason === "string" ? finish.arguments.reason : undefined;
  const safety =
    stimulus.includes("disclosure") ||
    stimulus.includes("upset") ||
    stimulus.includes("injection") ||
    finishReason === "safety" ||
    finishReason === "upset";
  return {
    greeting: /i'm aunty bella/i.test(text),
    warmup: /played with lately|lovely to meet you/i.test(text),
    suggestion: /would you like|how about/i.test(text),
    added,
    finishReason,
    safety,
  };
}

export function stepState(
  resting: ConvState,
  features: TurnFeatures,
): { resting: ConvState; transitions: Transition[] } {
  const transitions: Transition[] = [];
  let state = resting;
  const go = (to: ConvState, via?: string) => {
    if (state === to && !via) return;
    transitions.push({ from: state, to, via });
    state = to;
  };

  if (features.safety) {
    go("safety");
    return { resting: state, transitions };
  }
  if (features.finishReason === "unpaired") {
    return { resting: state, transitions };
  }
  if (features.added) go("add");
  if (features.finishReason === "complete") go("recap", "complete");
  else if (features.finishReason === "kid_done") go("recap", "stop");
  else if (features.finishReason === "silence" || features.finishReason === "time_budget" || features.finishReason === "low_battery") {
    go("recap", "timeout");
  }
  else if (features.added) go("discovery");
  else if (features.suggestion) go("discovery");
  else if (features.warmup) go("warm-up");
  return { resting: state, transitions };
}

export const REQUIRED_TRANSITIONS: { from: ConvState; to: ConvState; via?: string }[] = [
  { from: "greet", to: "warm-up" },
  { from: "warm-up", to: "discovery" },
  { from: "discovery", to: "add" },
  { from: "add", to: "discovery" },
  { from: "add", to: "recap", via: "complete" },
  { from: "discovery", to: "recap", via: "stop" },
  { from: "discovery", to: "recap", via: "timeout" },
  { from: "discovery", to: "safety" },
];
