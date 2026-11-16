export type TurnEvent = "speech_started" | "turn_ended";

export type TurnSummary = { floor: number; loudest: number; heardMs: number };

const QUIETEST_FLOOR = 80;
const LOUDEST_FLOOR = 1200;
const FLOOR_LEARNING_RATE = 0.15;
const SPEECH_OVER_FLOOR = 2.5;
const QUIETEST_SPEECH = 450;
const QUIET_SHARE_OF_VOICE = 0.3;
const LOUD_FRAMES_TO_START = 2;

export function rms(frame: Uint8Array): number {
  const samples = new Int16Array(frame.buffer, frame.byteOffset, frame.byteLength >> 1);
  if (!samples.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

export class TurnDetector {
  private floor = 0;
  private voice = 0;
  private loudest = 0;
  private loudRun = 0;
  private quietMs = 0;
  private heardMs = 0;
  private speaking = false;

  constructor(
    private frameMs: number,
    private silenceEndsTurnMs: number,
  ) {}

  reset(): void {
    this.floor = 0;
    this.voice = 0;
    this.loudest = 0;
    this.loudRun = 0;
    this.quietMs = 0;
    this.heardMs = 0;
    this.speaking = false;
  }

  summary(): TurnSummary {
    return { floor: Math.round(this.floor), loudest: Math.round(this.loudest), heardMs: this.heardMs };
  }

  feed(level: number): TurnEvent | null {
    this.heardMs += this.frameMs;
    if (!this.floor) this.floor = Math.min(Math.max(level, QUIETEST_FLOOR), LOUDEST_FLOOR);
    const speechLevel = Math.max(this.floor * SPEECH_OVER_FLOOR, QUIETEST_SPEECH);

    if (!this.speaking) {
      if (level < speechLevel) {
        this.loudRun = 0;
        this.floor += (Math.max(level, QUIETEST_FLOOR) - this.floor) * FLOOR_LEARNING_RATE;
        return null;
      }
      this.loudest = Math.max(this.loudest, level);
      this.voice = this.loudRun ? Math.max(this.voice, level) : level;
      if (++this.loudRun < LOUD_FRAMES_TO_START) return null;
      this.speaking = true;
      this.quietMs = 0;
      return "speech_started";
    }

    this.loudest = Math.max(this.loudest, level);
    const quiet = level < Math.max(speechLevel * 0.7, this.voice * QUIET_SHARE_OF_VOICE);
    if (!quiet) {
      this.voice = Math.max(this.voice, level);
      this.quietMs = 0;
      return null;
    }
    this.quietMs += this.frameMs;
    if (this.quietMs < this.silenceEndsTurnMs) return null;
    this.speaking = false;
    this.loudRun = 0;
    return "turn_ended";
  }
}
