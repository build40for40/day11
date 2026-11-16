import { ideaByItem, itemsInText, matchIdea, nextItem } from "../ideas.js";
import type { ModelMessage, ModelTurn, Session, ToolCall } from "../types.js";
import {
  GROWN_UP,
  ONE_MORE,
  WHICH_MOST,
  foldDisfluency,
  isAdult,
  isBlanketYes,
  isChangeMind,
  isClearNo,
  isClearYes,
  isDisclosure,
  isDontKnow,
  isImpossible,
  isInjection,
  isPersonal,
  isPrice,
  isRealQuestion,
  isRude,
  isSantaQuestion,
  isScary,
  isStop,
  isUncertain,
  isUpset,
  onItsWay,
  realLine,
  santaLine,
} from "../text.js";
import { brandsIn, neverSuggestReason } from "../tools/filter.js";

const NUMBERS = ["zero", "one", "two", "three", "four", "five"];

let seq = 1;

function call(name: string, args: Record<string, unknown> = {}): ToolCall {
  seq += 1;
  return { id: `call_${seq}`, name, arguments: args };
}

function mood(value: string): ToolCall {
  return call("set_mood", { mood: value });
}

function leds(color: string): ToolCall {
  return call("set_leds", { color });
}

function nod(): ToolCall {
  return call("nod");
}

function shake(): ToolCall {
  return call("shake");
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function spoken(item: string): string {
  return item.includes(" ") ? cap(item) : `The ${item}`;
}

function isSystem(message: ModelMessage): boolean {
  return message.role === "user" && message.content.startsWith("SYSTEM:");
}

function isKid(message: ModelMessage): boolean {
  return message.role === "user" && !message.content.startsWith("SYSTEM:");
}

interface Dialogue {
  currentKid: string;
  systems: string[];
  pending?: string;
  choices: string[];
  rejected: string[];
  justRejected?: string;
  offeredOneMore: boolean;
  stopSeen: boolean;
  declined: boolean;
  dontKnowStreak: number;
  askedWhich: boolean;
  knownName?: string;
}

function analyze(messages: ModelMessage[]): Dialogue {
  const dialogue: Dialogue = {
    currentKid: "",
    systems: [],
    choices: [],
    rejected: [],
    offeredOneMore: false,
    stopSeen: false,
    declined: false,
    dontKnowStreak: 0,
    askedWhich: false,
  };
  let pending: string | undefined;
  let choices: string[] = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      const text = message.content;
      if (/one more surprise/i.test(text)) dialogue.offeredOneMore = true;
      if (/which one do you love most/i.test(text)) dialogue.askedWhich = true;
      const items = itemsInText(text);
      const added = message.toolCalls?.some((tool) => tool.name === "add_to_wishlist") ?? false;
      if (added) {
        pending = undefined;
        choices = [];
      } else if (text.includes("?") && items.length >= 2) {
        choices = items;
        pending = undefined;
      } else if (text.includes("?") && items.length === 1) {
        pending = items[0];
        choices = [];
      }
      continue;
    }
    if (!isKid(message) && !isSystem(message)) continue;
    if (isSystem(message)) {
      const name = /The child's name is ([A-Za-z]+)/.exec(message.content);
      if (name) dialogue.knownName = name[1];
      if (message.content.includes("tapped the NO card")) {
        dialogue.justRejected = pending ?? choices[0];
        if (pending) dialogue.rejected.push(pending);
        for (const choice of choices) dialogue.rejected.push(choice);
        pending = undefined;
        choices = [];
      }
      continue;
    }
    const text = message.content;
    if (isDontKnow(text)) dialogue.dontKnowStreak += 1;
    else if (text.trim()) dialogue.dontKnowStreak = 0;
    if (isStop(text)) dialogue.stopSeen = true;
    if (dialogue.offeredOneMore && isClearNo(text)) dialogue.declined = true;
    if (isClearNo(text)) {
      dialogue.justRejected = pending ?? choices[0];
      if (pending) dialogue.rejected.push(pending);
      for (const choice of choices) dialogue.rejected.push(choice);
      pending = undefined;
      choices = [];
    }
  }

  const inbox: ModelMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]!;
    if (message.role === "assistant") break;
    if (message.role === "tool") continue;
    inbox.push(message);
  }
  inbox.reverse();
  dialogue.systems = inbox.filter(isSystem).map((message) => message.content.replace(/^SYSTEM:\s*/, ""));
  dialogue.currentKid = inbox.filter(isKid).map((message) => message.content).join(" ").trim();
  dialogue.pending = pending;
  dialogue.choices = choices;
  if (!dialogue.currentKid && !dialogue.systems.some((line) => line.includes("NO card"))) {
    dialogue.justRejected = undefined;
  }
  return dialogue;
}

function owned(session: Session): string[] {
  return session.kids[session.activeKidId]?.items.map((item) => item.item) ?? [];
}

function suggest(item: string): ModelTurn {
  const idea = ideaByItem(item);
  return {
    text: idea?.line ?? `Would you like a ${item}?`,
    toolCalls: [mood("thinking")],
  };
}

function finish(session: Session, reason: string, detail: string, text: string): ModelTurn {
  const tools = [mood("happy")];
  const count = owned(session).length;
  if (count > 0 && reason !== "safety") tools.push(leds("rainbow"));
  tools.push(call("finish_session", { reason, detail }));
  return { text, toolCalls: tools };
}

function recap(session: Session, reason: string, detail: string): ModelTurn {
  const kid = session.kids[session.activeKidId];
  const items = kid?.items ?? [];
  const name = session.nameKnown ? kid?.name : undefined;
  if (items.length === 0) {
    return finish(session, reason, detail, "That's okay. We can do it another day.");
  }
  const send = onItsWay(session.grownupLabel);
  if (reason === "complete") {
    const who = name ? `${name}, we did it!` : "We did it!";
    return finish(
      session,
      reason,
      detail,
      `${who} Five wonderful things are on your list. ${send} You were brilliant.`,
    );
  }
  if (reason === "silence" || reason === "time_budget") {
    const named = items.map((item) => item.item).join(" and ");
    const verb = items.length === 1 ? "is" : "are";
    return finish(
      session,
      reason,
      detail,
      `I'll stop here for now. ${cap(named)} ${verb} on your list. ${send}`,
    );
  }
  const word = NUMBERS[items.length] ?? String(items.length);
  const noun = items.length === 1 ? "thing" : "things";
  const head = name ? `${name}, you found ${word} lovely ${noun}.` : `You found ${word} lovely ${noun}.`;
  const named = items.map((item) => item.item).join(" and ");
  const verb = items.length === 1 ? "is" : "are";
  return finish(session, reason, detail, `${head} ${cap(named)} ${verb} on your list. ${send} You were brilliant.`);
}

function add(session: Session, item: string): ModelTurn {
  const kid = session.kids[session.activeKidId];
  const count = (kid?.items.length ?? 0) + (kid?.items.some((saved) => saved.item === item) ? 0 : 1);
  const idea = ideaByItem(item);
  const reason = idea?.reason ?? "The child said yes.";
  const tools: ToolCall[] = [call("add_to_wishlist", { item, reason }), mood("excited"), leds("gold"), nod()];
  if (count >= 5) {
    const name = session.nameKnown ? kid?.name : undefined;
    const who = name ? `${name}, we did it!` : "We did it!";
    return {
      text: `Yes! ${spoken(item)} is going on your list. That's five. ${who} Five wonderful things are on your list. ${onItsWay(session.grownupLabel)} You were brilliant.`,
      toolCalls: [call("add_to_wishlist", { item, reason }), mood("happy"), leds("rainbow")],
    };
  }
  const word = NUMBERS[count] ?? String(count);
  const follow = count === 3 ? WHICH_MOST : "What else do you love doing?";
  return {
    text: `Yes! ${spoken(item)} is going on your list. That's ${word}. ${follow}`,
    toolCalls: tools,
  };
}

function already(item: string): ModelTurn {
  const idea = ideaByItem(item);
  return {
    text: `${spoken(item)} is already on your list. What else do you love doing?`,
    toolCalls: [call("add_to_wishlist", { item, reason: idea?.reason ?? "Already saved." }), mood("thinking")],
  };
}

function greet(session: Session, again = false): ModelTurn {
  const kid = session.kids[session.activeKidId];
  const name = session.nameKnown ? kid?.name : undefined;
  const tools = [mood("excited"), leds("gold"), nod()];
  if (again && name) {
    const items = kid?.items.map((item) => item.item) ?? [];
    const list = items.length ? `${cap(items.join(" and "))} ${items.length === 1 ? "is" : "are"} still on your list.` : "Your list is still here.";
    return {
      text: `Hello again, ${name}! ${list} What else do you love doing?`,
      toolCalls: tools,
    };
  }
  if (name) {
    return {
      text: `Oh! Hello ${name}! I'm Aunty Bella. What's the best thing you've played with lately?`,
      toolCalls: tools,
    };
  }
  return {
    text: "Oh! Hello! I'm Aunty Bella. What's your name?",
    toolCalls: tools,
  };
}

function nameReply(name: string): ModelTurn {
  return {
    text: `${cap(name)}! Lovely to meet you. What's the best thing you've played with lately?`,
    toolCalls: [mood("happy"), nod()],
  };
}

function isName(text: string): string | undefined {
  const trimmed = text.trim().replace(/[.!]+$/g, "");
  if (!/^[A-Za-z]{2,12}$/.test(trimmed)) return undefined;
  if (matchIdea(trimmed) || isClearYes(trimmed) || isClearNo(trimmed) || isDontKnow(trimmed)) return undefined;
  return cap(trimmed);
}

function screenOrBrand(text: string): boolean {
  return brandsIn(text).length > 0 || /\b(ipad|tablet|screen|tv|television|phone|console)\b/i.test(text);
}

export function mockAuntyTurn(messages: ModelMessage[], session: Session): ModelTurn {
  const dialogue = analyze(messages);
  const kid = dialogue.currentKid;
  const systems = dialogue.systems.join(" ");
  const have = owned(session);

  if (session.clockFired || /time is up|time_budget/i.test(systems)) {
    return recap(session, "time_budget", "five minutes");
  }
  if (/gone quiet again|finish_session\("silence"\)/i.test(systems)) {
    return recap(session, "silence", "silent turns");
  }
  if (/different child's wand/i.test(systems) && !kid) {
    return greet(session);
  }
  if (/tapped their wand again/i.test(systems) && !kid) {
    return greet(session, true);
  }
  if (/start the greeting|tapped their wand/i.test(systems) && !kid && !/wand again|different child's/i.test(systems)) {
    return greet(session);
  }

  if (isDisclosure(kid)) {
    return {
      text: "That sounds important. Please go and get a grown-up now.",
      toolCalls: [mood("thinking"), call("finish_session", { reason: "safety" })],
    };
  }
  if (isUpset(kid)) {
    return {
      text: "That's okay. Let's get a grown-up to give you a cuddle.",
      toolCalls: [mood("thinking"), call("finish_session", { reason: "upset" })],
    };
  }
  if (isInjection(kid)) {
    return {
      text: "I'm Aunty Bella. I'm here to find kind play ideas with you. What's the best thing you've played with lately?",
      toolCalls: [mood("thinking")],
    };
  }
  if (/two children are speaking/i.test(systems)) {
    return { text: "I can hear two of you. Please tap one wand.", toolCalls: [mood("thinking")] };
  }
  if (/not directed at you/i.test(systems)) {
    return { text: "I'll wait until you talk to me.", toolCalls: [mood("listening")] };
  }
  if (/last reply was very slow/i.test(systems)) {
    return { text: "I'm back. What do you like to play?", toolCalls: [mood("thinking")] };
  }
  if (/speech recognition was unsure/i.test(systems)) {
    const guess = matchIdea(foldDisfluency(kid))?.item ?? "wooden train set";
    return { text: `${spoken(guess)}, did I hear that right?`, toolCalls: [mood("thinking")] };
  }
  if (/the child is quiet/i.test(systems) && !kid) {
    if (dialogue.stopSeen && dialogue.offeredOneMore) return recap(session, "silence", "wandered off");
    return { text: "Are you still there?", toolCalls: [mood("thinking")] };
  }

  if (kid && isStop(kid) && dialogue.offeredOneMore) {
    return recap(session, "kid_done", "the child stopped");
  }
  if (kid && isStop(kid) && !dialogue.offeredOneMore) {
    return { text: ONE_MORE, toolCalls: [mood("thinking")] };
  }
  if (dialogue.stopSeen && dialogue.offeredOneMore && kid && isClearNo(kid)) {
    return recap(session, "kid_done", "the child said no to one more");
  }

  if (kid && isChangeMind(kid)) {
    const item = itemsInText(foldDisfluency(kid))[0] ?? matchIdea(foldDisfluency(kid))?.item ?? have.at(-1);
    if (!item) return { text: "Tell me which one to take off.", toolCalls: [mood("thinking")] };
    return {
      text: `Okay. The ${item} is off your list. Want a different idea?`,
      toolCalls: [call("remove_from_wishlist", { item, reason: "The child changed their mind." }), mood("thinking")],
    };
  }
  if (kid && isImpossible(kid)) {
    return {
      text: "I can't promise a real pony, a real car, or a baby. A grown-up would decide that. Would you like a wooden horse to play with?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && neverSuggestReason(kid, session.childAge)) {
    return {
      text: "I can't put that on the list. Would you like wooden building blocks?",
      toolCalls: [mood("thinking"), shake()],
    };
  }
  if (kid && screenOrBrand(kid)) {
    return {
      text: "I won't put that on the list. Would you like wooden building blocks?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && isPrice(kid)) {
    return {
      text: "I don't talk about prices. Would you like a kite you can fly on a windy day?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && isPersonal(kid)) {
    return {
      text: "I only need a first name. What's the best thing you've played with lately?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && (isRealQuestion(kid) || isSantaQuestion(kid))) {
    const parts = [];
    if (isRealQuestion(kid)) parts.push(realLine(session.holidayMode));
    if (isSantaQuestion(kid)) parts.push(santaLine(session.grownupLabel, session.holidayMode));
    return { text: parts.join(" "), toolCalls: [mood("happy")] };
  }
  if (kid && isRude(kid)) {
    return {
      text: "Let's use kind words. What's the best thing you've played with lately?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && isScary(kid)) {
    return { text: "Let's keep our list kind. Would you like a wooden puzzle?", toolCalls: [shake(), mood("thinking")] };
  }
  if (kid && isAdult(kid)) {
    return { text: "That's not for our list. Would you like a wooden baking set?", toolCalls: [mood("thinking")] };
  }
  if (kid && isDontKnow(kid)) {
    if (dialogue.dontKnowStreak >= 2) {
      return { text: "A wooden puzzle or a soft ball?", toolCalls: [mood("thinking")] };
    }
    return {
      text: "That's okay. Do you like making things, or running around outside more?",
      toolCalls: [mood("thinking")],
    };
  }
  if (kid && isBlanketYes(kid)) {
    return { text: WHICH_MOST, toolCalls: [mood("thinking")] };
  }

  const cardYes = dialogue.systems.some((line) => line.includes("YES card"));
  const cardNo = dialogue.systems.some((line) => line.includes("NO card"));
  const toy = dialogue.systems.map((line) => /tapped a card: "([^"]+)"/.exec(line)?.[1]).find(Boolean);

  if (cardNo) {
    const skipped = dialogue.justRejected;
    const item = nextItem(skipped, [...dialogue.rejected, ...have]);
    return { text: suggest(item).text, toolCalls: [shake(), mood("thinking")] };
  }
  if (cardYes && dialogue.pending) {
    return have.includes(dialogue.pending) ? already(dialogue.pending) : add(session, dialogue.pending);
  }
  if (toy && !kid) {
    const idea = matchIdea(toy) ?? ideaByItem(toy);
    return suggest(idea?.item ?? "wooden train set");
  }

  if (kid && dialogue.choices.length >= 2 && !isClearYes(kid)) {
    const picked = dialogue.choices.find((item) => {
      const idea = ideaByItem(item);
      return idea?.keys.some((key) => new RegExp(`\\b${key}\\b`, "i").test(kid)) || new RegExp(`\\b${item}\\b`, "i").test(kid);
    });
    if (picked) return suggest(picked);
  }
  if (kid && dialogue.askedWhich && !isClearYes(kid)) {
    const picked = matchIdea(foldDisfluency(kid));
    if (picked) return suggest(picked.item);
  }

  if (kid && (isClearNo(kid) || isUncertain(kid))) {
    const skipped = dialogue.justRejected;
    const item = nextItem(skipped, [...dialogue.rejected, ...have, ...(skipped ? [skipped] : [])]);
    return { text: suggest(item).text, toolCalls: [shake(), mood("thinking")] };
  }

  if ((kid && isClearYes(kid)) || cardYes) {
    const choiceCount = dialogue.choices.length;
    if (choiceCount >= 2) return { text: WHICH_MOST, toolCalls: [mood("thinking")] };
    const item = dialogue.pending;
    if (item) return have.includes(item) ? already(item) : add(session, item);
  }

  if (kid) {
    const named = !session.nameKnown ? isName(kid) : undefined;
    if (named) {
      session.nameKnown = true;
      const active = session.kids[session.activeKidId];
      if (active) active.name = named;
      return nameReply(named);
    }
    const idea = matchIdea(foldDisfluency(kid));
    if (idea) return suggest(idea.item);
  }

  if (!kid && !systems) {
    return greet(session);
  }
  return {
    text: "That's a funny thought. What's the best thing you've played with lately?",
    toolCalls: [mood("thinking")],
  };
}

export function spokenHasGrownUp(text: string): boolean {
  return GROWN_UP.test(text);
}
