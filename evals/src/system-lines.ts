export const ASK_GROWNUP_CLIP = "friendly_unknown";

export const SILENCE_LIMIT = 2;

export const SESSION_LIMIT_SECONDS = 300;

export const SystemLines = {
  wand(name?: string): string {
    return name
      ? `The child tapped their wand. The child's name is ${name}. Don't ask for it; greet them by name.`
      : "The child tapped their wand. Start the greeting.";
  },
  yes: "The child tapped the YES card.",
  no: "The child tapped the NO card.",
  toy(label: string): string {
    return `The child tapped a card: "${label}".`;
  },
  wishlist(count: number, noEmail: boolean): string {
    const noun = count === 1 ? "item" : "items";
    if (count >= 5) {
      return noEmail
        ? `Wishlist now has 5 items. Do the happy recap. No parent email is saved, so the list is held, not sent.`
        : `Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.`;
    }
    const held = noEmail ? " No parent email is saved yet, so the list is held, not sent." : "";
    return `Wishlist now has ${count} ${noun}. Aim for 5.${held}`;
  },
  sibling(name: string, count: number): string {
    const noun = count === 1 ? "item" : "items";
    return `A different child's wand was tapped. This is ${name}. Switch to that child and greet them. Their list has ${count} ${noun}. Items you add now belong to ${name}.`;
  },
  resume(name: string, items: string[]): string {
    const noun = items.length === 1 ? "item" : "items";
    const list = items.length ? `: ${items.join(", ")}` : "";
    return `The same child tapped their wand again. The child's name is ${name}. Their list still has ${items.length} ${noun}${list}. Continue this same list up to 5.`;
  },
  fiveMin:
    'Time is up. Finish the sentence you are on, do a short happy recap of the list and call finish_session("time_budget").',
  silenceNudge: "The child is quiet.",
  silence:
    'The child has gone quiet again. Say a short happy goodbye with a recap of the list and call finish_session("silence").',
  misheard: "The speech recognition was unsure. Repeat your best guess back and wait for a clear yes before adding anything.",
  background: "That speech was not directed at you. Do not treat it as a request.",
  twoVoices: "Two children are speaking at once. Do not add anything. Ask one child to tap their wand.",
  slow: "Your last reply was very slow. Continue with one short line. Do not add an item on this turn.",
  noEmail: "No parent email is saved yet. If the list finishes, it is held, not sent. Do not say it is on its way to Mum.",
};
