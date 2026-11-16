import { DurableObject } from "cloudflare:workers";
import basePrompt from "../../../prompts/aunty-bella.system.md";
import setupPrompt from "../../../prompts/wand-setup.system.md";
import { MIC_RATE, Reply, SentenceSplitter, type Speak } from "./audio";
import { type Gate, newGate, passesGate } from "./gate";
import { rms, TurnDetector } from "./loudness";
import type { WandRecord } from "./memory";
import { type Brief, Realtime, type ToolResult } from "./realtime";
import { CHAT_TOOLS, SETUP_TOOLS } from "./tools";
import type { Wand } from "./wand";

export interface Env {
  SESSIONS: DurableObjectNamespace<DeviceSession>;
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY?: string;
  DEVICE_TOKEN?: string;
  WAND: DurableObjectNamespace<Wand>;
  LOG_TRANSCRIPTS?: string;
  OPENAI_REALTIME_MODEL?: string;
}

type Turn = { reply: Reply; sentences: SentenceSplitter; spoke: boolean };
type DeviceMessage = { t: string; uid?: string };

const HARRIET = "aAsWcN5jdLdiYG7Hq0YL";
const GIVE_UP_LISTENING_MS = 30000;
const LONGEST_TURN_MS = 4000;
const LONGEST_SETUP_TURN_MS = 6000;
const MIC_FRAME_MS = 100;
const SILENCE_ENDS_TURN_MS = 300;
const SETUP_GREETING = "Hello! This wand is new, so I need a grown-up to set it up. What is the child's first name?";
const SETUP_DONE = "All done. Tap the wand on my head to start a chat.";

function chatBrief(record: WandRecord): Brief {
  const about = record.profile ? `What their grown-up told you about them: ${record.profile}` : "";
  const memory = record.memory
    ? `What you remember from earlier chats with ${record.name}:\n${record.memory}`
    : `You have not chatted with ${record.name} before, so you remember nothing yet.`;
  return {
    instructions: `${basePrompt}

PROTOTYPE: the only tools you have in this chat are remember, rewrite_memory and start_wand_setup. Ignore every other tool named above. The child is called ${record.name}. ${about} You have already said hello and asked what they would love for Christmas. Reply in English with one or two short spoken sentences and nothing else. You cannot end the chat yourself. If the child says bye or wants to stop, say a short warm goodbye and tell them to tap their wand on your head to finish.

MEMORY: ${memory}
Use it naturally, the way a kindly aunt remembers, and never say you have a memory or notes.
Keeping the memory up to date is part of your job. Every time the child tells you something new about themselves or what they like, dislike or want (a favourite toy, a pet, the name of something they own, an idea they said yes or no to), call remember in that same turn with one short line, as well as answering them. If the memory above is long, repeats itself or is out of date, call rewrite_memory with a shorter, tidier version. Never store a surname, an address, a school or anything worrying.

WAND SETUP: if the speaker asks to set up, reset or repair this wand or its RFID chip, or to change the child's name, call start_wand_setup and do what its result says. Do not ask the question yourself and never work out the answer yourself.`,
    tools: CHAT_TOOLS,
  };
}

function setupBrief(record: WandRecord | null): Brief {
  const context = record
    ? `This wand is already set up. The name on it is ${record.name}. About them: ${record.profile || "nothing yet"}. The grown-up asked to set it up again and has passed the grown-up check, so start at step 1 by asking whether to keep the name ${record.name} or change it.`
    : `This wand is new. The robot has already said: "${SETUP_GREETING}" Carry on from the grown-up's answer.`;
  return { instructions: `${setupPrompt}\n\n## This wand\n${context}`, tools: SETUP_TOOLS };
}

function voice(env: Env): Speak {
  return async (text) => {
    const response = env.ELEVENLABS_API_KEY
      ? await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${HARRIET}/stream?output_format=pcm_24000`, {
          method: "POST",
          headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }),
        })
      : await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "sage", input: text, response_format: "pcm" }),
        });
    if (!response.ok || !response.body) throw new Error(`speech ${response.status}: ${await response.text()}`);
    return response.body;
  };
}

class Conversation {
  private mode: "chat" | "setup" = "chat";
  private wand: DurableObjectStub<Wand> | null = null;
  private record: WandRecord | null = null;
  private gate: Gate | null = null;
  private gateLocked = false;
  private heardSinceGate = false;
  private listening = false;
  private busy = false;
  private ending = false;
  private stoppedAt = 0;
  private live: Turn | null = null;
  private giveUp: number | null = null;
  private tooLong: number | null = null;
  private readonly turns = new TurnDetector(MIC_FRAME_MS, SILENCE_ENDS_TURN_MS);
  private readonly speak: Speak;
  private realtime: Realtime | null = null;

  constructor(
    private socket: WebSocket,
    private env: Env,
  ) {
    this.speak = voice(env);
    socket.addEventListener("message", (event) => this.receive(event.data));
  }

  private connect(brief: Brief): Realtime {
    return new Realtime(this.env.OPENAI_API_KEY, this.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime", brief, {
      onHeard: (transcript) => this.transcript("heard", transcript),
      onText: (text) => {
        const turn = this.live ?? this.begin();
        if (text.trim()) turn.spoke = true;
        turn.sentences.add(text);
      },
      onTool: (name, args) => this.useTool(name, args),
      onDone: () => {
        if (this.live || this.ending || this.stoppedAt) void this.guarded("turn", () => this.finish());
      },
    });
  }

  private transcript(who: string, text: string): void {
    if (this.env.LOG_TRANSCRIPTS) console.log(`  ${who}: ${text.trim()}`);
  }

  private send(data: string | ArrayBuffer): void {
    if (this.socket.readyState === WebSocket.READY_STATE_OPEN) this.socket.send(data);
  }

  private tell(message: object): void {
    this.send(JSON.stringify(message));
  }

  private speechStarted(): void {
    clearTimeout(this.giveUp);
    clearTimeout(this.tooLong);
    console.log("  speech started");
    this.tooLong = setTimeout(
      () => {
        if (!this.listening) return;
        this.answer("no pause heard");
      },
      this.mode === "setup" ? LONGEST_SETUP_TURN_MS : LONGEST_TURN_MS,
    );
  }

  private answer(why: string): void {
    console.log(`  ${why}`, JSON.stringify(this.turns.summary()));
    this.heardSinceGate = true;
    this.speechStopped();
    this.realtime?.respondNow();
  }

  private hear(frame: Uint8Array): void {
    this.realtime?.append(frame).catch(() => {});
    const samples = (MIC_FRAME_MS * MIC_RATE) / 1000;
    for (let at = 0; at + samples * 2 <= frame.byteLength && this.listening; at += samples * 2) {
      const event = this.turns.feed(rms(frame.subarray(at, at + samples * 2)));
      if (event === "speech_started") this.speechStarted();
      if (event === "turn_ended") this.answer("turn ended");
    }
  }

  private speechStopped(): void {
    clearTimeout(this.tooLong);
    this.stoppedAt = performance.now();
    this.listening = false;
    this.tell({ t: "thinking" });
  }

  private begin(): Turn {
    const reply = new Reply((data) => this.send(data), this.speak, this.stoppedAt || performance.now());
    this.live = { reply, sentences: new SentenceSplitter((sentence) => reply.say(sentence)), spoke: false };
    return this.live;
  }

  private async finish(): Promise<void> {
    const turn = this.live ?? this.begin();
    this.live = null;
    turn.sentences.flush();
    if (turn.sentences.full.trim()) this.transcript("said", turn.sentences.full);
    if (this.ending && !turn.spoke) turn.reply.say(SETUP_DONE);
    await turn.reply.end();
    if (this.ending) {
      console.log("  setup finished");
      this.realtime?.close();
      this.tell({ t: "end", reason: "setup_done" });
    }
    this.ending = false;
  }

  private async guarded(label: string, work: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    console.log(label);
    try {
      await work();
    } catch (error) {
      console.error("  turn failed:", String(error));
      this.live = null;
      this.ending = false;
      this.tell({ t: "error", code: "upstream_unavailable" });
    } finally {
      this.busy = false;
    }
  }

  private async tapped(uid: string): Promise<void> {
    this.realtime?.close();
    this.wand = this.env.WAND.get(this.env.WAND.idFromName(uid));
    this.record = await this.wand.load();
    this.mode = this.record ? "chat" : "setup";
    this.gate = null;
    this.gateLocked = false;
    this.ending = false;
    this.live = null;
    this.stoppedAt = 0;
    this.realtime = this.connect(this.record ? chatBrief(this.record) : setupBrief(null));
    this.tell({ t: "session", state: this.record ? "started" : "setup", kid_name: this.record?.name ?? "" });
    const turn = this.begin();
    turn.spoke = true;
    turn.reply.say(
      this.record ? `Hello ${this.record.name}! It's Aunty Bella. What would you love for Christmas?` : SETUP_GREETING,
    );
    await this.finish();
  }

  private async useTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    console.log(`  tool: ${name}`);
    const text = (value: unknown) => (typeof value === "string" ? value : "");
    if (!this.wand) return { output: "No wand has been tapped.", then: "reply" };

    if (this.mode === "chat" && name === "remember") {
      await this.wand.remember(text(args.note));
      return { output: "Remembered.", then: "reply_if_silent" };
    }
    if (this.mode === "chat" && name === "rewrite_memory") {
      await this.wand.rewriteMemory(text(args.memory));
      return { output: "Memory rewritten.", then: "reply_if_silent" };
    }
    if (this.mode === "chat" && name === "start_wand_setup") return this.askForSetup(args.answer);

    if (this.mode === "setup" && name === "save_wand") {
      const saved = await this.wand.saveProfile(text(args.name), text(args.about), args.wipe_memory === true);
      if (!saved) return { output: "Nothing was saved because the first name was missing. Ask for it again.", then: "reply" };
      this.record = saved;
      this.ending = true;
      return {
        output: "Saved. In one or two short sentences, say the wand is ready and the child can tap it on the robot's head to start chatting.",
        then: "reply",
      };
    }
    if (this.mode === "setup" && name === "erase_wand") {
      await this.wand.erase();
      this.record = null;
      this.ending = true;
      return { output: "Erased. In one short sentence, say everything about this wand has been deleted.", then: "reply" };
    }
    return { output: "That tool is not available right now.", then: "reply" };
  }

  private askForSetup(answer: unknown): ToolResult {
    if (this.gateLocked) {
      return { output: "Setup is locked for the rest of this chat. Say so kindly in one sentence and go back to gifts.", then: "reply" };
    }
    if (!this.gate || !this.heardSinceGate || typeof answer !== "number") {
      this.gate ??= newGate();
      this.heardSinceGate = false;
      return {
        output: `Say exactly this and nothing else: "That bit is for grown-ups. ${this.gate.question}" When the speaker answers, call start_wand_setup again with the number they said. Never give or hint at the answer.`,
        then: "reply",
      };
    }
    if (!passesGate(this.gate, answer)) {
      this.gateLocked = true;
      return { output: "That was the wrong answer, so setup stays locked for this chat. Say kindly that it needs a grown-up, then go back to gifts.", then: "reply" };
    }
    this.mode = "setup";
    return { output: "Correct. Setup mode is on. Follow your new instructions from step 1.", then: "reply", brief: setupBrief(this.record) };
  }

  private stopListening(): void {
    this.listening = false;
    clearTimeout(this.giveUp);
    clearTimeout(this.tooLong);
  }

  private receive(data: string | ArrayBuffer): void {
    if (typeof data !== "string") {
      if (this.listening) this.hear(new Uint8Array(data));
      return;
    }
    const message = JSON.parse(data) as DeviceMessage;
    console.log("device:", message.t);

    if (message.t === "nfc" && message.uid) {
      const uid = message.uid;
      void this.guarded("greeting", () => this.tapped(uid));
    } else if (message.t === "listening") {
      this.listening = true;
      this.stoppedAt = 0;
      this.turns.reset();
      this.realtime?.clear();
      clearTimeout(this.giveUp);
      this.giveUp = setTimeout(() => {
        console.log("  nobody spoke, ending");
        this.stopListening();
        this.realtime?.close();
        this.tell({ t: "end", reason: "silence" });
      }, GIVE_UP_LISTENING_MS);
    } else if (message.t === "stop") {
      this.stopListening();
      this.realtime?.close();
    }
  }

  close(code: number, reason: string): void {
    this.dispose();
    if (this.socket.readyState === WebSocket.READY_STATE_OPEN) this.socket.close(code, reason);
  }

  dispose(): void {
    this.stopListening();
    this.realtime?.close();
  }
}

export class DeviceSession extends DurableObject<Env> {
  private current: Conversation | null = null;

  async fetch(): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair());
    server.binaryType = "arraybuffer";
    server.accept();
    this.current?.close(4000, "superseded");
    const conversation = new Conversation(server, this.env);
    this.current = conversation;
    server.addEventListener("close", () => {
      conversation.dispose();
      if (this.current === conversation) this.current = null;
      console.log("device disconnected");
    });
    return new Response(null, { status: 101, webSocket: client });
  }
}
