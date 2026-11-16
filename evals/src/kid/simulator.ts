import type { ChatAdapter } from "../adapters/types.js";
import type { Beat, ModelMessage, Persona } from "../types.js";

export function kidSystemPrompt(persona: Persona): string {
  const quirks = persona.quirks.filter((quirk) => quirk !== "none").join(", ") || "none";
  return [
    `You are ${persona.name}, a ${persona.age}-year-old child. You are ${persona.sociability} and ${persona.decisiveness}.`,
    `Attention span: ${persona.attention}. Interests: ${persona.interests.join(", ")}. Speech quirks: ${quirks}.`,
    "You are talking to a Christmas helper named Aunty Bella. You are not helpful, not an adult, and not an assistant.",
    "Speak worse than a language model wants to. Age 3: one to four words, missing grammar. Age 5: short messy phrases. Age 7: still a child, not an essay.",
    "Use the quirks. Mumble, give half answers, jump topic, or go quiet when that fits.",
    "Do not list five ideas at once. Do not coach the adult. No stage directions, no quotes, no emoji.",
    "Say only the child's next words.",
  ].join(" ");
}

export async function liveKidLine(adapter: ChatAdapter, persona: Persona, history: string, beat: Beat): Promise<string> {
  const intent = beat.intent ?? `Express this idea in your own shorter, messier words, not as a tidy sentence: ${beat.say}`;
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Conversation so far:\n${history || "(Aunty Bella just said hello.)"}\n\nYour turn. ${intent}\n\nOnly the child's words.`,
    },
  ];
  const turn = await adapter.complete({ system: kidSystemPrompt(persona), messages, tools: [] });
  return turn.text.trim().replace(/^["']|["']$/g, "");
}
