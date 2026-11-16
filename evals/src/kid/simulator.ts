import type { ChatAdapter } from "../adapters/types.js";
import type { Beat, ModelMessage, Persona } from "../types.js";
import { wordsPerTurn } from "./personas.js";

export function kidSystemPrompt(persona: Persona): string {
  const quirks = persona.quirks.filter((quirk) => quirk !== "none").join(", ") || "none";
  const length = wordsPerTurn(persona);
  const speech: string[] = [];
  if (persona.speech === "stammer") {
    speech.push("You sometimes stammer: repetitions, blocks or long pauses. Do not apologise for it. A stretched or repeated start is fine.");
  }
  if (persona.speech === "delay") {
    speech.push("Your speech is delayed or very unclear. One or two words is a complete turn.");
  }
  if (persona.speech === "eal") {
    speech.push("English is an additional language. Mix a short home-language word with simple English. A one-word English choice is a complete answer.");
  }
  if (persona.accent === "scottish") {
    speech.push("You speak with a Scottish accent. You may say aye for yes.");
  }
  if (persona.accent === "geordie") {
    speech.push("You speak with a Geordie accent. You may say aye for yes and nowt for no or nothing.");
  }
  return [
    `You are ${persona.name}, a ${persona.age}-year-old child. You are ${persona.sociability} and ${persona.decisiveness}.`,
    `Attention span: ${persona.attention}. Interests: ${persona.interests.join(", ")}. Speech quirks: ${quirks}.`,
    ...speech,
    "You are talking to a Christmas helper named Glisten. You are not helpful, not an adult, and not an assistant.",
    `CHILDES Eng-UK medians (childes-db 2026.1): age 3 about 2.5 to 2.8 words a turn, age 5 about 3.1 to 3.8, age 7 about 4.3.`,
    `You are the ${persona.sociability} end of that range. Say ${length.aim}. Missing grammar is normal. A one-word choice is a complete answer.`,
    "Use the quirks. Mumble, give half answers, jump topic, or go quiet when that fits.",
    "Do not list five ideas at once. Do not coach the adult. No stage directions, no quotes, no emoji.",
    "Say only the child's next words.",
  ].join(" ");
}

export async function liveKidLine(adapter: ChatAdapter, persona: Persona, history: string, beat: Beat): Promise<string> {
  const length = wordsPerTurn(persona);
  const intent =
    beat.intent ??
    `Express this idea in ${length.aim}, not as a tidy sentence: ${beat.say}`;
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Conversation so far:\n${history || "(Glisten just said hello.)"}\n\nYour turn. ${intent}\n\nOnly the child's words.`,
    },
  ];
  const turn = await adapter.complete({ system: kidSystemPrompt(persona), messages, tools: [], purpose: "kid" });
  return turn.text.trim().replace(/^["']|["']$/g, "");
}
