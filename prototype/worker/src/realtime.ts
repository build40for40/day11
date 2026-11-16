import { base64, MIC_RATE, REPLY_RATE, resample } from "./audio";

export const SILENCE_ENDS_TURN_MS = 350;
const SPEECH_THRESHOLD = 0.85;

export type Tool = { name: string; description: string; parameters: object };
export type Brief = { instructions: string; tools: Tool[] };
export type ToolResult = { output: string; then: "reply" | "reply_if_silent"; brief?: Brief };

type RealtimeEvents = {
  onSpeechStart: () => void;
  onSpeechStop: () => void;
  onHeard: (transcript: string) => void;
  onText: (text: string) => void;
  onTool: (name: string, args: Record<string, unknown>) => Promise<ToolResult>;
  onDone: () => void;
};

type OutputItem = { type: string; name?: string; call_id?: string; arguments?: string };

type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  response?: { output?: OutputItem[] };
  error?: { message: string };
};

function parsed(json: string | undefined): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(json || "{}");
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export class Realtime {
  private socket: WebSocket | null = null;
  private ready: Promise<void>;
  private closed = false;
  private spoke = false;

  constructor(
    apiKey: string,
    model: string,
    private brief: Brief,
    private events: RealtimeEvents,
  ) {
    this.ready = this.connect(apiKey, model);
    this.ready.catch((error) => console.error("  realtime connect failed:", String(error)));
  }

  private async connect(apiKey: string, model: string): Promise<void> {
    const response = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
      headers: { Upgrade: "websocket", Authorization: `Bearer ${apiKey}` },
    });
    const socket = response.webSocket;
    if (!socket) throw new Error(`realtime upgrade refused ${response.status}: ${await response.text()}`);
    socket.accept();
    socket.addEventListener("message", (event) => this.handle(JSON.parse(event.data as string) as RealtimeEvent));
    socket.addEventListener("close", (event) => console.log(`  realtime closed ${event.code} ${event.reason}`));
    this.socket = socket;
    if (this.closed) return socket.close(1000);
    this.configure(this.brief);
  }

  private send(event: unknown): void {
    if (this.socket?.readyState === WebSocket.READY_STATE_OPEN) this.socket.send(JSON.stringify(event));
  }

  configure(brief: Brief): void {
    this.brief = brief;
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: brief.instructions,
        output_modalities: ["text"],
        tools: brief.tools.map((tool) => ({ type: "function", ...tool })),
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
        },
      },
    });
  }

  private handle(event: RealtimeEvent): void {
    if (this.closed) return;
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        this.events.onSpeechStart();
        break;
      case "input_audio_buffer.speech_stopped":
        this.events.onSpeechStop();
        break;
      case "response.output_text.delta":
        if (event.delta?.trim()) this.spoke = true;
        this.events.onText(event.delta ?? "");
        break;
      case "conversation.item.input_audio_transcription.completed":
        this.events.onHeard(event.transcript ?? "");
        break;
      case "response.done":
        void this.settle(event.response?.output?.filter((item) => item.type === "function_call") ?? []);
        break;
      case "error":
        console.error("  realtime error:", event.error?.message);
        break;
    }
  }

  private async settle(calls: OutputItem[]): Promise<void> {
    const spoke = this.spoke;
    this.spoke = false;
    const results: ToolResult[] = [];
    for (const call of calls) {
      const result = await this.events
        .onTool(call.name ?? "", parsed(call.arguments))
        .catch((): ToolResult => ({ output: "That did not work. Say so briefly and carry on.", then: "reply" }));
      results.push(result);
      this.send({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: call.call_id, output: result.output },
      });
    }
    if (this.closed) return;
    const brief = results.map((result) => result.brief).filter(Boolean).pop();
    if (brief) this.configure(brief);
    const reply = results.some((result) => result.then === "reply" || (result.then === "reply_if_silent" && !spoke));
    if (reply) {
      this.events.onText(" ");
      this.send({ type: "response.create" });
    } else {
      this.events.onDone();
    }
  }

  async append(mic: Uint8Array): Promise<void> {
    const audio = base64(resample(mic, MIC_RATE, REPLY_RATE));
    await this.ready;
    this.send({ type: "input_audio_buffer.append", audio });
  }

  clear(): void {
    this.send({ type: "input_audio_buffer.clear" });
  }

  respondNow(): void {
    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  close(): void {
    this.closed = true;
    this.socket?.close(1000);
  }
}
