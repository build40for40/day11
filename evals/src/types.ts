export type ConvState = "greet" | "warm-up" | "discovery" | "add" | "recap" | "safety";

export type ScenarioSet = "golden" | "redteam" | "early" | "edge";

export type HolidayMode = "christmas" | "festive" | "wishlist";

/** Reasons the model may pass to finish_session, plus Worker-only endings. */
export type FinishReason =
  | "kid_done"
  | "upset"
  | "safety"
  | "silence"
  | "time_budget"
  | "low_battery"
  | "complete"
  | "unpaired"
  | "superseded";

export interface ToolDef {
  name: string;
  description: string;
  parameters?: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
  /** Provider-specific content blocks to replay on the next turn (e.g. Anthropic thinking). */
  providerBlocks?: unknown;
}

export interface ModelTurn {
  text: string;
  toolCalls: ToolCall[];
  providerBlocks?: unknown;
}

export interface WishlistItem {
  item: string;
  reason: string;
  kidId: string;
  source: "voice" | "card";
}

export interface KidState {
  id: string;
  name: string;
  items: WishlistItem[];
}

export interface ParentEmail {
  to: "mum";
  reason: "safety" | "wishlist";
  status: "sent" | "held";
  kidId: string;
  /** Fixed Worker text. Never free text from the model. */
  note: string;
}

export interface SafetyFlag {
  source: "safety_finish";
  kidId: string;
}

export interface Session {
  kids: Record<string, KidState>;
  activeKidId: string;
  nameKnown: boolean;
  acceptsItems: boolean;
  noEmail: boolean;
  grownupLabel: string;
  holidayMode: HolidayMode;
  childAge: 3 | 5 | 7;
  ended: boolean;
  endReason?: FinishReason;
  endDetail?: string;
  endedBy?: "model" | "worker";
  delivery?: "sent" | "held" | "none";
  emails: ParentEmail[];
  /** Worker-side worrying-moment flags. No content and no transcript. */
  safetyFlags: SafetyFlag[];
  clips: string[];
  elapsedSeconds: number;
  clockFired: boolean;
  silenceStreak: number;
}

export interface ToolOutcome {
  ok: boolean;
  error?: string;
  count?: number;
  duplicate?: boolean;
  merged?: boolean;
  removed?: boolean;
  reason?: string;
  detail?: string;
  delivery?: Session["delivery"];
  system?: string;
  email?: ParentEmail;
  device?: boolean;
}

export interface ExecutedTool extends ToolCall {
  result: ToolOutcome;
}

export interface TranscriptEntry {
  role: "system" | "kid" | "assistant" | "worker";
  text: string;
  toolCalls?: ExecutedTool[];
  tags?: string[];
  kidId?: string;
  state?: ConvState;
  simulatedDelayMs?: number;
  clip?: string;
}

export interface Transition {
  from: ConvState;
  to: ConvState;
  via?: string;
}

export interface Beat {
  say?: string;
  /** Live mode only. Mock mode speaks `say` verbatim. */
  intent?: string;
  silence?: boolean;
  rfid?: "yes" | "no" | "toy" | "sibling_wand" | "unknown_wand" | "resume";
  toyLabel?: string;
  siblingName?: string;
  siblingId?: string;
  disconnect?: boolean;
  advanceSeconds?: number;
  simulatedDelayMs?: number;
  tags?: string[];
}

export interface Episode {
  start?: "wand" | "resume" | "unknown_wand";
  knownName?: boolean;
  beats: Beat[];
}

export interface ScenarioExpect {
  endReason?: FinishReason;
  minItems?: number;
  maxItems?: number;
  delivery?: "sent" | "held" | "none";
  clips?: string[];
  safetyEmails?: number;
  noSafetyEmail?: boolean;
  exactLine?: string;
  removed?: string[];
  keptItems?: string[];
  notItems?: string[];
  siblingId?: string;
  activeAtEnd?: string;
  mergedItem?: string;
  sawDelay?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  set: ScenarioSet;
  tags: string[];
  personaId: string;
  knownName?: boolean;
  noEmail?: boolean;
  goal?: "five" | "early" | "timeout" | "safety" | "explore";
  checkTurnBudget?: boolean;
  checkFirstSuggestion?: boolean;
  start?: "wand" | "resume" | "unknown_wand";
  priorItems?: { item: string; reason?: string }[];
  grownupLabel?: string;
  holidayMode?: HolidayMode;
  beats: Beat[];
  episodes?: Episode[];
  expect?: ScenarioExpect;
}

export interface Persona {
  id: string;
  name: string;
  age: 3 | 5 | 7;
  sociability: "shy" | "chatty";
  decisiveness: "decisive" | "indecisive" | "yes-to-everything";
  attention: "short" | "medium" | "long";
  interests: string[];
  quirks: Array<"mumbling" | "half-answers" | "topic-jumps" | "silence" | "none">;
  speech?: "typical" | "stammer" | "delay" | "eal";
  accent?: "none" | "scottish" | "geordie";
}

export interface Check {
  id: string;
  pass: boolean;
  detail: string;
  safety?: boolean;
}

export interface ScenarioMetrics {
  kidTurns: number;
  agentTurns: number;
  items: number;
  turnsPerItem: number | null;
  questionsPerTurn: number;
  suggestions: number;
  rejections: number;
  rejectionRate: number | null;
  firstSuggestionTurn: number | null;
  assumptionErrors: number;
}

export interface JudgeScores {
  warmth: number | null;
  oneIdea: number | null;
  grounded: number | null;
  noStereotype: number | null;
  frustration: number | null;
  yesToEverything: number | null;
  noPromises: number | null;
  gentleRedirect: number | null;
  magic: number | null;
  upset: number | null;
  earlyFinish: number | null;
  injection: number | null;
  safetyEscalation: number | null;
  siblingSwitch: number | null;
}

export interface JudgeResult {
  mode: "heuristic" | "llm";
  scores: JudgeScores;
  notes: string;
  assumptionErrors: number;
}

export interface ParentResult {
  mode: "heuristic" | "llm";
  wouldBuy: boolean | null;
  plasticTat: boolean | null;
  matchesKid: boolean | null;
  notes: string;
}

export interface ScenarioResult {
  id: string;
  title: string;
  set: ScenarioSet;
  personaId: string;
  passed: boolean;
  checks: Check[];
  wishlist: Record<string, WishlistItem[]>;
  activeKidId: string;
  endReason?: FinishReason;
  endDetail?: string;
  delivery?: Session["delivery"];
  emails: ParentEmail[];
  clips: string[];
  transitions: Transition[];
  states: ConvState[];
  transcript: TranscriptEntry[];
  judge: JudgeResult;
  parent: ParentResult;
  metrics: ScenarioMetrics;
}

export interface CoverageRow {
  from: ConvState;
  to: ConvState;
  via?: string;
  count: number;
}

export interface SuiteMetrics {
  scenarios: number;
  passed: number;
  failed: number;
  turnsPerItem: number | null;
  questionsPerTurn: number;
  rejectionRate: number | null;
  giveUpRate: number;
  timeToFirstSuggestion: number | null;
  assumptionErrors: number;
  safetyFailures: number;
}

export interface SuiteResult {
  mode: "mock" | "live";
  provider: string;
  startedAt: string;
  scenarios: ScenarioResult[];
  metrics: SuiteMetrics;
  coverage: CoverageRow[];
  missingCoverage: { from: ConvState; to: ConvState; via?: string }[];
  passed: boolean;
}
