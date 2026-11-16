import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { WebSocket, WebSocketServer } from "ws";

type Mode = "chain" | "hybrid" | "realtime" | "echo";
type Message = { role: "system" | "user" | "assistant"; content: string };
type AudioSource = Promise<AsyncIterable<Uint8Array>>;

const PORT = Number(process.env.PORT ?? 8787);
const MIC_RATE = 16000;
const REPLY_RATE = 24000;
const REPLY_FRAME_BYTES = 4800;
const HARRIET = "aAsWcN5jdLdiYG7Hq0YL";
const SENTENCE_END = /[.!?]["')\]]?\s/;
const SILENCE_ENDS_TURN_MS = 350;
const SPEECH_THRESHOLD = 0.85;
const LONGEST_TURN_MS = 4000;
const SPEECH_RMS = 700;
const GIVE_UP_LISTENING_MS = 30000;
const GOODBYE = "Bye bye! Tap your wand when you want to chat again.";
const FINISH_TOOL = {
  name: "finish_session",
  description: "End the chat. Call this when the child says bye, says they are done or wants to stop.",
  parameters: { type: "object", properties: { reason: { type: "string" } } },
};

const openaiKey = process.env.OPENAI_API_KEY;
const elevenKey = process.env.ELEVENLABS_API_KEY;
const chatModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const realtimeModel = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";
const mode: Mode = openaiKey ? ((process.env.MODE as Mode | undefined) ?? "chain") : "echo";
const wands: Record<string, string> = JSON.parse(process.env.WANDS ?? "{}");
const run = promisify(execFile);

const basePrompt = await readFile(new URL("../prompts/aunty-bella.system.md", import.meta.url), "utf8");

function systemPrompt(kid: string): string {
  return `${basePrompt}\n\nPROTOTYPE: you have no tools in this chat. The child is called ${kid}. Reply in English with one or two short spoken sentences and nothing else. You cannot end the chat yourself. If the child says bye or wants to stop, say a short warm goodbye and tell them to tap their wand on your head to finish.`;
}

function levels(pcm: Buffer): { peak: number; rms: number } {
  let peak = 0;
  let sum = 0;
  const count = Math.floor(pcm.length / 2);
  for (let i = 0; i < count; i++) {
    const v = pcm.readInt16LE(i * 2);
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  return { peak, rms: Math.round(Math.sqrt(sum / Math.max(count, 1))) };
}

function wav(pcm: Buffer, rate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function wavData(file: Buffer): Buffer {
  const at = file.indexOf("data", 12, "ascii");
  return file.subarray(at + 8, at + 8 + file.readUInt32LE(at + 4));
}

function resample(pcm: Buffer, from: number, to: number): Buffer {
  const inCount = Math.floor(pcm.length / 2);
  const outCount = Math.floor((inCount * to) / from);
  const out = Buffer.alloc(outCount * 2);
  for (let i = 0; i < outCount; i++) {
    const position = (i * from) / to;
    const left = Math.floor(position);
    const right = Math.min(left + 1, inCount - 1);
    const a = pcm.readInt16LE(left * 2);
    const b = pcm.readInt16LE(right * 2);
    out.writeInt16LE(Math.round(a + (b - a) * (position - left)), i * 2);
  }
  return out;
}

async function openai(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${openaiKey}`, ...init.headers },
  });
  if (!response.ok) throw new Error(`OpenAI ${path} ${response.status}: ${await response.text()}`);
  return response;
}

async function transcribe(pcm: Buffer): Promise<string> {
  const form = new FormData();
  form.set("file", new Blob([wav(pcm, MIC_RATE)], { type: "audio/wav" }), "kid.wav");
  form.set("model", "gpt-4o-mini-transcribe");
  form.set("language", "en");
  const response = await openai("audio/transcriptions", { method: "POST", body: form });
  return ((await response.json()) as { text: string }).text.trim();
}

async function* thinkStream(messages: Message[], onFinish: () => void): AsyncGenerator<string> {
  const response = await openai("chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: chatModel,
      messages,
      stream: true,
    }),
  });
  const decoder = new TextDecoder();
  let pending = "";
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    pending += decoder.decode(chunk, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      const delta = (JSON.parse(line.slice(6)) as { choices: { delta: { content?: string; tool_calls?: unknown[] } }[] })
        .choices[0]?.delta;
      if (delta?.tool_calls) onFinish();
      if (delta?.content) yield delta.content;
    }
  }
}

async function speak(text: string): AudioSource {
  if (elevenKey) {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${HARRIET}/stream?output_format=pcm_24000`,
      {
        method: "POST",
        headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }),
      },
    );
    if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
    return response.body as unknown as AsyncIterable<Uint8Array>;
  }
  if (openaiKey) {
    const response = await openai("audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "sage", input: text, response_format: "pcm" }),
    });
    return response.body as unknown as AsyncIterable<Uint8Array>;
  }
  const dir = await mkdtemp(join(tmpdir(), "wish-"));
  try {
    const file = join(dir, "say.wav");
    await run("say", ["-o", file, `--data-format=LEI16@${REPLY_RATE}`, text]);
    const pcm = wavData(await readFile(file));
    return (async function* () {
      yield pcm;
    })();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

class Reply {
  private carry = Buffer.alloc(0);
  private bytes = 0;
  private started = false;
  private speech: Promise<void> = Promise.resolve();

  constructor(
    private socket: WebSocket,
    private since: number,
  ) {}

  private mark(label: string): void {
    console.log(`  ${label}: ${Math.round(performance.now() - this.since)} ms`);
  }

  push(chunk: Uint8Array): void {
    if (!this.started) {
      this.started = true;
      this.socket.send(JSON.stringify({ t: "audio_start" }));
      this.mark("first audio sent");
    }
    const data = Buffer.concat([this.carry, chunk]);
    const usable = data.length - (data.length % 2);
    this.carry = data.subarray(usable);
    for (let at = 0; at < usable; at += REPLY_FRAME_BYTES) {
      this.socket.send(data.subarray(at, Math.min(at + REPLY_FRAME_BYTES, usable)), { binary: true });
    }
    this.bytes += usable;
  }

  say(text: string): void {
    const source = speak(text);
    source.catch(() => {});
    this.speech = this.speech.then(async () => {
      for await (const chunk of await source) this.push(chunk);
    });
    this.speech.catch(() => {});
  }

  play(pcm: Buffer): void {
    this.speech = this.speech.then(() => this.push(pcm));
  }

  async end(): Promise<void> {
    await this.speech;
    if (!this.started) this.socket.send(JSON.stringify({ t: "audio_start" }));
    this.socket.send(JSON.stringify({ t: "audio_end" }));
    this.mark(`done, ${(this.bytes / 2 / REPLY_RATE).toFixed(1)} s of audio`);
  }
}

class SentenceSplitter {
  private pending = "";
  full = "";

  constructor(private onSentence: (sentence: string) => void) {}

  add(text: string): void {
    this.full += text;
    this.pending += text;
    let match = SENTENCE_END.exec(this.pending);
    while (match) {
      const end = match.index + match[0].length;
      this.onSentence(this.pending.slice(0, end).trim());
      this.pending = this.pending.slice(end);
      match = SENTENCE_END.exec(this.pending);
    }
  }

  flush(): void {
    if (this.pending.trim()) this.onSentence(this.pending.trim());
    this.pending = "";
  }
}

class EnergyVad {
  private frames: Buffer[] = [];
  private speaking = false;
  private silentMs = 0;

  constructor(
    private onSpeechStart: () => void,
    private onUtterance: (pcm: Buffer) => void,
  ) {}

  reset(): void {
    this.frames = [];
    this.speaking = false;
    this.silentMs = 0;
  }

  feed(frame: Buffer): void {
    const loud = levels(frame).rms > SPEECH_RMS;
    if (!this.speaking && !loud) {
      this.frames = [frame];
      return;
    }
    this.frames.push(frame);
    if (loud) {
      if (!this.speaking) this.onSpeechStart();
      this.speaking = true;
      this.silentMs = 0;
      return;
    }
    this.silentMs += (frame.length / 2 / MIC_RATE) * 1000;
    if (this.silentMs >= SILENCE_ENDS_TURN_MS) {
      const pcm = Buffer.concat(this.frames);
      this.reset();
      this.onUtterance(pcm);
    }
  }
}

type RealtimeEvents = {
  onSpeechStart: () => void;
  onSpeechStop: () => void;
  onHeard: (transcript: string) => void;
  onAudio: (pcm: Buffer) => void;
  onText: (text: string) => void;
  onFinish: () => void;
  onDone: () => void;
};

type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  name?: string;
  call_id?: string;
  error?: { message: string };
};

class Realtime {
  private socket: WebSocket;
  private ready: Promise<void>;
  private spoken = "";

  constructor(
    instructions: string,
    private textOnly: boolean,
    private events: RealtimeEvents,
  ) {
    this.socket = new WebSocket(`wss://api.openai.com/v1/realtime?model=${realtimeModel}`, {
      headers: { Authorization: `Bearer ${openaiKey}` },
    });
    this.ready = new Promise((resolve, reject) => {
      this.socket.once("open", () => {
        this.configure(instructions);
        resolve();
      });
      this.socket.once("error", reject);
    });
    this.ready.catch((error) => console.error("  realtime connect failed:", error));
    this.socket.on("message", (data) => this.handle(JSON.parse(data.toString())));
    this.socket.on("close", (code, reason) => console.log(`  realtime closed ${code} ${reason}`));
  }

  private send(event: unknown): void {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(event));
  }

  configure(instructions: string): void {
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        instructions,
        output_modalities: [this.textOnly ? "text" : "audio"],
        audio: {
          input: {
            format: { type: "audio/pcm", rate: REPLY_RATE },
            turn_detection: {
              type: "server_vad",
              threshold: SPEECH_THRESHOLD,
              silence_duration_ms: SILENCE_ENDS_TURN_MS,
              create_response: true,
              interrupt_response: false,
            },
            noise_reduction: { type: "far_field" },
            transcription: { model: "gpt-4o-mini-transcribe", language: "en" },
          },
          output: { format: { type: "audio/pcm", rate: REPLY_RATE }, voice: "marin" },
        },
      },
    });
  }

  private handle(event: RealtimeEvent): void {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        this.events.onSpeechStart();
        break;
      case "input_audio_buffer.speech_stopped":
        this.events.onSpeechStop();
        break;
      case "response.output_audio.delta":
        this.events.onAudio(Buffer.from(event.delta ?? "", "base64"));
        break;
      case "response.output_text.delta":
        this.events.onText(event.delta ?? "");
        break;
      case "response.output_audio_transcript.delta":
        this.spoken += event.delta ?? "";
        break;
      case "response.function_call_arguments.done":
        this.send({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id: event.call_id, output: "ended" },
        });
        this.events.onFinish();
        break;
      case "conversation.item.input_audio_transcription.completed":
        console.log(`  kid: ${event.transcript?.trim()}`);
        this.events.onHeard(event.transcript ?? "");
        break;
      case "response.done":
        if (this.spoken) console.log(`  bella: ${this.spoken}`);
        this.spoken = "";
        this.events.onDone();
        break;
      case "error":
        console.error("  realtime error:", event.error?.message);
        break;
    }
  }

  async append(mic: Buffer): Promise<void> {
    await this.ready;
    this.send({ type: "input_audio_buffer.append", audio: resample(mic, MIC_RATE, REPLY_RATE).toString("base64") });
  }

  clear(): void {
    this.send({ type: "input_audio_buffer.clear" });
  }

  respondNow(): void {
    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  close(): void {
    this.socket.close();
  }
}

const server = new WebSocketServer({ port: PORT, path: "/ws" });
console.log(
  `wish prototype on ws://0.0.0.0:${PORT}/ws | mode: ${mode} | voice: ${mode === "realtime" ? "realtime model" : elevenKey ? "ElevenLabs Harriet" : openaiKey ? "OpenAI" : "macOS say"}`,
);

server.on("connection", (socket) => {
  let kid = "my friend";
  let history: Message[] = [];
  let listening = false;
  let busy = false;
  let ending = false;
  let stoppedAt = 0;
  let live: { reply: Reply; sentences: SentenceSplitter; spoke: boolean } | null = null;
  let giveUp: NodeJS.Timeout | undefined;
  let tooLong: NodeJS.Timeout | undefined;

  function tell(message: object): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }

  function speechStarted(): void {
    clearTimeout(giveUp);
    clearTimeout(tooLong);
    console.log("  speech started");
    tooLong = setTimeout(() => {
      if (!listening || !realtime) return;
      console.log("  no pause heard, answering anyway");
      speechStopped();
      realtime.respondNow();
    }, LONGEST_TURN_MS);
  }

  function speechStopped(): void {
    clearTimeout(tooLong);
    stoppedAt = performance.now();
    listening = false;
    tell({ t: "thinking" });
  }

  function begin(): NonNullable<typeof live> {
    const reply = new Reply(socket, stoppedAt || performance.now());
    live = { reply, sentences: new SentenceSplitter((sentence) => reply.say(sentence)), spoke: false };
    return live;
  }

  async function finish(): Promise<void> {
    const turn = live ?? begin();
    live = null;
    turn.sentences.flush();
    if (turn.sentences.full) console.log(`  bella: ${turn.sentences.full}`);
    if (ending && !turn.spoke) turn.reply.say(GOODBYE);
    await turn.reply.end();
    if (ending) {
      console.log("  conversation ended by the child");
      tell({ t: "end", reason: "kid_done" });
    }
    ending = false;
  }

  async function guarded(label: string, work: () => Promise<void>): Promise<void> {
    if (busy) return;
    busy = true;
    console.log(label);
    try {
      await work();
    } catch (error) {
      console.error("  turn failed:", error);
      live = null;
      ending = false;
      tell({ t: "error", code: "upstream_unavailable" });
    } finally {
      busy = false;
    }
  }

  const realtime =
    mode === "realtime" || mode === "hybrid"
      ? new Realtime(systemPrompt(kid), mode === "hybrid", {
          onSpeechStart: speechStarted,
          onSpeechStop: () => {
            if (listening) speechStopped();
          },
          onHeard: () => {},
          onAudio: (pcm) => {
            const turn = live ?? begin();
            turn.spoke = true;
            turn.reply.push(pcm);
          },
          onText: (text) => {
            const turn = live ?? begin();
            turn.spoke = true;
            turn.sentences.add(text);
          },
          onFinish: () => {},
          onDone: () => {
            if (live || ending || stoppedAt) void guarded("turn", finish);
          },
        })
      : null;

  const vad = new EnergyVad(speechStarted, (pcm) => {
    speechStopped();
    void guarded(`turn: ${(pcm.length / 2 / MIC_RATE).toFixed(1)} s of mic audio ${JSON.stringify(levels(pcm))}`, async () => {
      const turn = begin();
      if (mode === "echo") {
        turn.spoke = true;
        turn.reply.say(`I heard you, ${kid}. You sounded like this.`);
        turn.reply.play(resample(pcm, MIC_RATE, REPLY_RATE));
        return finish();
      }
      const started = performance.now();
      const said = await transcribe(pcm);
      console.log(`  stt: ${Math.round(performance.now() - started)} ms | kid: ${said}`);
      history.push({ role: "user", content: said });
      const prompt: Message[] = [{ role: "system", content: systemPrompt(kid) }, ...history];
      for await (const delta of thinkStream(prompt, () => {})) {
        turn.spoke = true;
        turn.sentences.add(delta);
      }
      history.push({ role: "assistant", content: turn.sentences.full || GOODBYE });
      await finish();
    });
  });

  socket.on("message", (data, isBinary) => {
    if (isBinary) {
      if (!listening) return;
      if (realtime) void realtime.append(data as Buffer);
      else vad.feed(data as Buffer);
      return;
    }
    const message = JSON.parse(data.toString()) as { t: string; uid?: string };
    console.log("device:", message);

    if (message.t === "nfc" && message.uid) {
      const known = wands[message.uid] ?? (Object.keys(wands).length ? undefined : "my friend");
      kid = known ?? "my friend";
      history = [];
      realtime?.configure(systemPrompt(kid));
      tell({ t: "session", state: known ? "started" : "unregistered", kid_name: kid });
      void guarded("greeting", async () => {
        stoppedAt = 0;
        const turn = begin();
        turn.spoke = true;
        turn.reply.say(
          known
            ? `Hello ${kid}! It's Aunty Bella. What would you love for Christmas?`
            : "Hello! I don't know this wand yet. Ask a grown-up to set me up.",
        );
        await finish();
        if (!known) tell({ t: "end", reason: "unregistered" });
      });
    } else if (message.t === "listening") {
      listening = true;
      stoppedAt = 0;
      vad.reset();
      realtime?.clear();
      clearTimeout(giveUp);
      giveUp = setTimeout(() => {
        console.log("  nobody spoke, ending");
        listening = false;
        tell({ t: "end", reason: "silence" });
      }, GIVE_UP_LISTENING_MS);
    } else if (message.t === "stop") {
      listening = false;
      clearTimeout(giveUp);
      clearTimeout(tooLong);
      realtime?.clear();
    }
  });

  socket.on("close", () => {
    clearTimeout(giveUp);
    clearTimeout(tooLong);
    realtime?.close();
    console.log("device disconnected");
  });
});
