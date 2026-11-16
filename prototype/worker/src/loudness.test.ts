import assert from "node:assert/strict";
import { test } from "node:test";
import { rms, TurnDetector, type TurnEvent } from "./loudness";

function run(detector: TurnDetector, levels: number[]): (TurnEvent | null)[] {
  return levels.map((level) => detector.feed(level));
}

test("a turn starts on the second loud frame and ends after the silence wait", () => {
  const detector = new TurnDetector(100, 300);
  const events = run(detector, [200, 210, 190, 2400, 2600, 2500, 220, 200, 210]);
  assert.deepEqual(events, [null, null, null, null, "speech_started", null, null, null, "turn_ended"]);
});

test("a single loud click is not speech", () => {
  const detector = new TurnDetector(100, 300);
  assert.deepEqual(run(detector, [200, 200, 3000, 200, 200, 200, 200]), Array(7).fill(null));
});

test("a short pause inside a sentence does not end the turn", () => {
  const detector = new TurnDetector(100, 300);
  const events = run(detector, [200, 2000, 2200, 250, 240, 2100, 2000, 230, 220, 210]);
  assert.equal(events.filter(Boolean).join(), "speech_started,turn_ended");
  assert.equal(events.at(-1), "turn_ended");
});

test("a noisy room raises the bar, and a drop back to room level ends the turn", () => {
  const detector = new TurnDetector(100, 300);
  const room = [900, 950, 880, 920, 900];
  const events = run(detector, [...room, 4200, 4500, 4000, 950, 900, 920]);
  assert.equal(events.filter(Boolean).join(), "speech_started,turn_ended");
  assert.deepEqual(run(new TurnDetector(100, 300), [...room, 1300, 1400, 1300, 900]), Array(9).fill(null));
});

test("rms reads little-endian 16-bit samples", () => {
  const frame = new Uint8Array(new Int16Array([3000, -3000, 3000, -3000]).buffer);
  assert.equal(rms(frame), 3000);
});
