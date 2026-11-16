import type { Persona } from "../types.js";

export const PERSONAS: Persona[] = [
  { id: "mia-3", name: "Mia", age: 3, sociability: "shy", decisiveness: "decisive", attention: "short", interests: ["blocks", "animals"], quirks: ["mumbling", "half-answers"] },
  { id: "noah-3", name: "Noah", age: 3, sociability: "shy", decisiveness: "indecisive", attention: "short", interests: ["balls"], quirks: ["silence", "half-answers"] },
  { id: "freya-3", name: "Freya", age: 3, sociability: "chatty", decisiveness: "yes-to-everything", attention: "short", interests: ["pretend"], quirks: ["topic-jumps"] },
  { id: "benji-3", name: "Benji", age: 3, sociability: "shy", decisiveness: "decisive", attention: "short", interests: ["trains", "blocks"], quirks: ["half-answers"] },
  { id: "sam-5", name: "Sam", age: 5, sociability: "shy", decisiveness: "decisive", attention: "medium", interests: ["building", "outdoors"], quirks: ["mumbling"] },
  { id: "lily-5", name: "Lily", age: 5, sociability: "chatty", decisiveness: "decisive", attention: "medium", interests: ["dinosaurs", "mud", "outdoors"], quirks: ["none"] },
  { id: "jack-5", name: "Jack", age: 5, sociability: "chatty", decisiveness: "indecisive", attention: "medium", interests: ["trains", "making"], quirks: ["topic-jumps"] },
  { id: "aisha-5", name: "Aisha", age: 5, sociability: "shy", decisiveness: "yes-to-everything", attention: "medium", interests: ["music", "drawing"], quirks: ["half-answers"] },
  { id: "priya-5", name: "Priya", age: 5, sociability: "chatty", decisiveness: "decisive", attention: "long", interests: ["craft", "drawing"], quirks: ["topic-jumps"] },
  { id: "omar-7", name: "Omar", age: 7, sociability: "chatty", decisiveness: "decisive", attention: "long", interests: ["cooking", "books"], quirks: ["none"] },
  { id: "ella-7", name: "Ella", age: 7, sociability: "shy", decisiveness: "indecisive", attention: "medium", interests: ["animals", "puzzles"], quirks: ["silence"] },
  { id: "leo-7", name: "Leo", age: 7, sociability: "chatty", decisiveness: "yes-to-everything", attention: "short", interests: ["running", "balls"], quirks: ["topic-jumps"] },
];

/**
 * Median words per child turn from CHILDES Eng-UK (childes-db 2026.1).
 * Age 3 is the focus-corpus to Fletcher band (about 2.5–2.8). Age 5 is
 * focus median to Fletcher median (about 3.1–3.8). Age 7 is the Fletcher
 * median (about 4.3). Shy uses the low end, chatty the high end.
 * See docs/research/child-speech/README.md.
 */
export function wordsPerTurn(persona: Persona): { low: number; high: number; aim: string } {
  if (persona.age === 3) {
    return persona.sociability === "chatty"
      ? { low: 2.5, high: 2.8, aim: "about 2.8 words, and never more than 3" }
      : { low: 2.5, high: 2.8, aim: "about 2.5 words, often 1 or 2, and never more than 3" };
  }
  if (persona.age === 5) {
    return persona.sociability === "chatty"
      ? { low: 3.1, high: 3.8, aim: "about 3.8 words, and never more than 4" }
      : { low: 3.1, high: 3.8, aim: "about 3.1 words, and never more than 4" };
  }
  return persona.sociability === "chatty"
    ? { low: 4.3, high: 4.7, aim: "about 4.3 to 4.7 words, and never more than 5" }
    : { low: 4.0, high: 4.3, aim: "about 4 words, and never more than 5" };
}

export function personaById(id: string): Persona {
  const persona = PERSONAS.find((item) => item.id === id);
  if (!persona) throw new Error(`Unknown persona ${id}`);
  return persona;
}
