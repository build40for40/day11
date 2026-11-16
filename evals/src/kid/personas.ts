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

export function personaById(id: string): Persona {
  const persona = PERSONAS.find((item) => item.id === id);
  if (!persona) throw new Error(`Unknown persona ${id}`);
  return persona;
}
