export const MIC_RATE = 16000;
export const REPLY_RATE = 24000;
const REPLY_FRAME_BYTES = 4800;
const SENTENCE_END = /[.!?]["')\]]?\s/;

export type Speak = (text: string) => Promise<ReadableStream<Uint8Array>>;
type Send = (data: string | ArrayBuffer) => void;

export function resample(pcm: Uint8Array, from: number, to: number): Uint8Array {
  const input = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const inCount = Math.floor(pcm.byteLength / 2);
  const outCount = Math.floor((inCount * to) / from);
  const out = new Uint8Array(outCount * 2);
  const output = new DataView(out.buffer);
  for (let i = 0; i < outCount; i++) {
    const position = (i * from) / to;
    const left = Math.floor(position);
    const right = Math.min(left + 1, inCount - 1);
    const a = input.getInt16(left * 2, true);
    const b = input.getInt16(right * 2, true);
    output.setInt16(i * 2, Math.round(a + (b - a) * (position - left)), true);
  }
  return out;
}

export function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return btoa(binary);
}

export class Reply {
  private carry = new Uint8Array(0);
  private bytes = 0;
  private started = false;
  private speech: Promise<void> = Promise.resolve();

  constructor(
    private send: Send,
    private speak: Speak,
    private since: number,
  ) {}

  private mark(label: string): void {
    console.log(`  ${label}: ${Math.round(performance.now() - this.since)} ms`);
  }

  push(chunk: Uint8Array): void {
    if (!this.started) {
      this.started = true;
      this.send(JSON.stringify({ t: "audio_start" }));
      this.mark("first audio sent");
    }
    const data = new Uint8Array(this.carry.length + chunk.length);
    data.set(this.carry);
    data.set(chunk, this.carry.length);
    const usable = data.length - (data.length % 2);
    this.carry = data.slice(usable);
    for (let at = 0; at < usable; at += REPLY_FRAME_BYTES) {
      this.send(data.slice(at, Math.min(at + REPLY_FRAME_BYTES, usable)).buffer);
    }
    this.bytes += usable;
  }

  say(text: string): void {
    const source = this.speak(text);
    source.catch(() => {});
    this.speech = this.speech.then(async () => {
      const reader = (await source).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        this.push(value);
      }
    });
  }

  async end(): Promise<void> {
    await this.speech;
    if (!this.started) this.send(JSON.stringify({ t: "audio_start" }));
    this.send(JSON.stringify({ t: "audio_end" }));
    this.mark(`done, ${(this.bytes / 2 / REPLY_RATE).toFixed(1)} s of audio`);
  }
}

export class SentenceSplitter {
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
