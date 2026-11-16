import { DurableObject } from "cloudflare:workers";
import basePrompt from "../../../prompts/glisten.system.md";
import { Reply, SentenceSplitter, type Speak } from "./audio";
import { Realtime } from "./realtime";

export interface Env {
  SESSIONS: DurableObjectNamespace<DeviceSession>;
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY?: string;
  DEVICE_TOKEN?: string;
  WANDS?: string;
  OPENAI_REALTIME_MODEL?: string;
}

type Turn = { reply: Reply; sentences: SentenceSplitter; spoke: boolean };
type DeviceMessage = { t: string; uid?: string };

const HARRIET = "aAsWcN5jdLdiYG7Hq0YL";
const GIVE_UP_LISTENING_MS = 30000;
const LONGEST_TURN_MS = 4000;
const GOODBYE = "Bye bye! Tap your wand when you want to chat again.";

function systemPrompt(kid: string): string {
  return `${basePrompt}\n\nPROTOTYPE: you have no tools in this chat. The child is called ${kid}. Reply in English with one or two short spoken sentences and nothing else. You cannot end the chat yourself. If the child says bye or wants to stop, say a short warm goodbye and tell them to tap their wand on your head to finish.`;
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
  private kid = "my friend";
  private listening = false;
  private busy = false;
  private ending = false;
  private stoppedAt = 0;
  private live: Turn | null = null;
  private giveUp: number | null = null;
  private tooLong: number | null = null;
  private readonly wands: Record<string, string>;
  private readonly speak: Speak;
  private readonly realtime: Realtime;

  constructor(
    private socket: WebSocket,
    env: Env,
  ) {
    this.wands = JSON.parse(env.WANDS || "{}");
    this.speak = voice(env);
    this.realtime = new Realtime(env.OPENAI_API_KEY, env.OPENAI_REALTIME_MODEL ?? "gpt-realtime", systemPrompt(this.kid), {
      onSpeechStart: () => this.speechStarted(),
      onSpeechStop: () => {
        if (this.listening) this.speechStopped();
      },
      onHeard: () => {},
      onText: (text) => {
        const turn = this.live ?? this.begin();
        turn.spoke = true;
        turn.sentences.add(text);
      },
      onFinish: () => {},
      onDone: () => {
        if (this.live || this.ending || this.stoppedAt) void this.guarded("turn", () => this.finish());
      },
    });
    socket.addEventListener("message", (event) => this.receive(event.data));
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
    this.tooLong = setTimeout(() => {
      if (!this.listening) return;
      console.log("  no pause heard, answering anyway");
      this.speechStopped();
      this.realtime.respondNow();
    }, LONGEST_TURN_MS);
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
    if (turn.sentences.full) console.log(`  glisten: ${turn.sentences.full}`);
    if (this.ending && !turn.spoke) turn.reply.say(GOODBYE);
    await turn.reply.end();
    if (this.ending) {
      console.log("  conversation ended by the child");
      this.tell({ t: "end", reason: "kid_done" });
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

  private receive(data: string | ArrayBuffer): void {
    if (typeof data !== "string") {
      if (this.listening) this.realtime.append(new Uint8Array(data)).catch(() => {});
      return;
    }
    const message = JSON.parse(data) as DeviceMessage;
    console.log("device:", message.t);

    if (message.t === "nfc" && message.uid) {
      const known = this.wands[message.uid] ?? (Object.keys(this.wands).length ? undefined : "my friend");
      this.kid = known ?? "my friend";
      this.realtime.configure(systemPrompt(this.kid));
      this.tell({ t: "session", state: known ? "started" : "unregistered", kid_name: this.kid });
      void this.guarded("greeting", async () => {
        this.stoppedAt = 0;
        const turn = this.begin();
        turn.spoke = true;
        turn.reply.say(
          known
            ? `Hello ${this.kid}! It's Glisten. What would you love for Christmas?`
            : "Hello! I don't know this wand yet. Ask a grown-up to set me up.",
        );
        await this.finish();
        if (!known) this.tell({ t: "end", reason: "unregistered" });
      });
    } else if (message.t === "listening") {
      this.listening = true;
      this.stoppedAt = 0;
      this.realtime.clear();
      clearTimeout(this.giveUp);
      this.giveUp = setTimeout(() => {
        console.log("  nobody spoke, ending");
        this.listening = false;
        this.tell({ t: "end", reason: "silence" });
      }, GIVE_UP_LISTENING_MS);
    } else if (message.t === "stop") {
      this.listening = false;
      clearTimeout(this.giveUp);
      clearTimeout(this.tooLong);
      this.realtime.clear();
    }
  }

  close(code: number, reason: string): void {
    this.dispose();
    if (this.socket.readyState === WebSocket.READY_STATE_OPEN) this.socket.close(code, reason);
  }

  dispose(): void {
    clearTimeout(this.giveUp);
    clearTimeout(this.tooLong);
    this.realtime.close();
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
