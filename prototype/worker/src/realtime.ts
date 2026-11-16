import { base64, MIC_RATE, REPLY_RATE, resample } from "./audio";

export const SILENCE_ENDS_TURN_MS = 500;
const SPEECH_THRESHOLD = 0.75;
export const FINISH_TOOL = {
  name: "finish_session",
  description: "End the chat. Call this when the child says bye, says they are done or wants to stop.",
  parameters: { type: "object", properties: { reason: { type: "string" } } },
};

type RealtimeEvents = {
  onSpeechStart: () => void;
  onSpeechStop: () => void;
  onHeard: (transcript: string) => void;
  onText: (text: string) => void;
  onFinish: () => void;
  onDone: () => void;
};

type RealtimeEvent = {
  type: string;
  delta?: string;
  transcript?: string;
  call_id?: string;
  error?: { message: string };
};

export class Realtime {
  private socket: WebSocket | null = null;
  private ready: Promise<void>;
  private closed = false;

  constructor(
    apiKey: string,
    model: string,
    private instructions: string,
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
    this.configure(this.instructions);
  }

  private send(event: unknown): void {
    if (this.socket?.readyState === WebSocket.READY_STATE_OPEN) this.socket.send(JSON.stringify(event));
  }

  configure(instructions: string): void {
    this.instructions = instructions;
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        instructions,
        output_modalities: ["text"],
        tools: [{ type: "function", ...FINISH_TOOL }],
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
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        this.events.onSpeechStart();
        break;
      case "input_audio_buffer.speech_stopped":
        this.events.onSpeechStop();
        break;
      case "response.output_text.delta":
        this.events.onText(event.delta ?? "");
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
        this.events.onDone();
        break;
      case "error":
        console.error("  realtime error:", event.error?.message);
        break;
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
