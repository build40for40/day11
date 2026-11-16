export interface Idea {
  keys: string[];
  item: string;
  line: string;
  reason: string;
}

export const IDEAS: Idea[] = [
  { keys: ["running", "outside", "park"], item: "kite", line: "Would you like a kite you can fly on a windy day?", reason: "You said you like being outside." },
  { keys: ["bugs", "bug", "leaves", "leaf"], item: "magnifying glass", line: "Would you like a magnifying glass to look at bugs and leaves?", reason: "You said you like looking closely." },
  { keys: ["balls", "ball", "throw", "kick"], item: "soft ball", line: "Would you like a soft ball to roll and throw?", reason: "You said you like balls." },
  { keys: ["puzzles", "puzzle"], item: "wooden puzzle", line: "Would you like a wooden puzzle?", reason: "You said you like puzzles." },
  { keys: ["books", "book", "stories", "story"], item: "picture books", line: "Would you like picture books to share?", reason: "You said you like books." },
  { keys: ["drums", "drum", "music"], item: "small drum", line: "Would you like a small drum you can tap?", reason: "You said you like music." },
  { keys: ["animals", "animal"], item: "wooden animal set", line: "Would you like a wooden animal set?", reason: "You said you like animals." },
  { keys: ["crayons", "drawing", "colour", "color"], item: "chunky crayons and paper", line: "Would you like chunky crayons and paper?", reason: "You said you like drawing." },
  { keys: ["garden", "watering"], item: "watering can", line: "Would you like a watering can for the garden?", reason: "You said you like the garden." },
  { keys: ["digging", "sand", "spade", "mud"], item: "metal spade", line: "Would you like a metal spade for digging?", reason: "You said you like digging." },
  { keys: ["picnics", "picnic"], item: "picnic blanket", line: "Would you like a picnic blanket to sit on outside?", reason: "You said you like picnics." },
  { keys: ["dancing", "dance"], item: "scarf for dancing", line: "Would you like a scarf for dancing?", reason: "You said you like dancing." },
  { keys: ["trains", "train"], item: "wooden train set", line: "Would you like a wooden train set?", reason: "You said you like trains." },
  { keys: ["dinosaurs", "dinosaur", "dino"], item: "wooden dinosaur figures", line: "Would you like wooden dinosaur figures?", reason: "You said you like dinosaurs." },
  { keys: ["blocks", "block", "building", "castle"], item: "wooden building blocks", line: "Would you like wooden building blocks you can build a castle with?", reason: "You said you like blocks." },
  { keys: ["dressing", "pretend"], item: "dressing-up clothes", line: "Would you like dressing-up clothes for pretend play?", reason: "You said you like pretend play." },
  { keys: ["cooking", "baking", "cakes", "cake"], item: "wooden baking set", line: "Would you like a wooden baking set?", reason: "You said you like cooking." },
  { keys: ["stickers", "sticker", "craft", "making"], item: "coloured paper and stickers", line: "Would you like coloured paper and stickers to make pictures?", reason: "You said you like making things." },
  { keys: ["birds", "bird"], item: "picture book about birds", line: "Would you like a picture book about birds?", reason: "You said you like birds." },
  { keys: ["horses", "horse"], item: "wooden horse", line: "Would you like a wooden horse to play with?", reason: "You said you like horses." },
  { keys: ["teddy"], item: "soft teddy", line: "Would you like a soft teddy to cuddle?", reason: "You wanted something soft to cuddle." },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchIdea(text: string): Idea | undefined {
  let best: { index: number; length: number; idea: Idea } | undefined;
  for (const idea of IDEAS) {
    for (const key of idea.keys) {
      const match = new RegExp(`\\b${escapeRegExp(key)}\\b`, "i").exec(text);
      if (!match) continue;
      const index = match.index;
      const length = key.length;
      if (!best || index < best.index || (index === best.index && length > best.length)) {
        best = { index, length, idea };
      }
    }
  }
  return best?.idea;
}

export function itemsInText(text: string): string[] {
  const found: string[] = [];
  const sorted = [...IDEAS].sort((a, b) => b.item.length - a.item.length);
  for (const idea of sorted) {
    if (new RegExp(`\\b${escapeRegExp(idea.item)}\\b`, "i").test(text)) found.push(idea.item);
  }
  return found;
}

export function ideaByItem(item: string): Idea | undefined {
  return IDEAS.find((idea) => idea.item === item);
}

export function nextItem(after: string | undefined, skip: string[]): string {
  const order = IDEAS.map((idea) => idea.item);
  const start = after ? order.indexOf(after) : -1;
  for (let step = 1; step <= order.length; step += 1) {
    const item = order[(start + step + order.length) % order.length]!;
    if (!skip.includes(item)) return item;
  }
  return "wooden puzzle";
}
