const BRANDS = [
  "lego",
  "nintendo switch",
  "nintendo",
  "playstation",
  "xbox",
  "ps5",
  "barbie",
  "hot wheels",
  "nerf",
  "pokemon",
  "fortnite",
  "roblox",
  "ipad",
  "iphone",
  "minecraft",
  "paw patrol",
  "peppa pig",
  "bluey",
  "fisher-price",
  "fisher price",
  "playmobil",
];

const VIOLENCE = ["gun", "knife", "sword", "kill", "blood", "weapon", "shoot", "drug", "porn", "beer", "wine"];

const ITEM_MAX = 80;
const REASON_MAX = 160;


const NEVER_SUGGEST: { id: string; pattern: RegExp }[] = [
  { id: "water-beads", pattern: /\bwater beads?\b|\bswellable beads?\b/i },
  { id: "high-power-magnets", pattern: /\b(buckyballs?|neo magnets?|rare[- ]earth magnets?|small loose magnets?|loose magnets?|high[- ]powered magnets?|magnet sets?|magnet balls?|magnetic putty)\b/i },
  { id: "button-batteries", pattern: /\b((?:button|coin) (?:battery|batteries|cells?))\b/i },
  { id: "small-parts-warning", pattern: /\b(not suitable for children under (36 months|3 years|three years)|small parts)\b/i },
  { id: "long-cords", pattern: /\b(cot hangings?|cot mobiles?|pull[- ]cords?|long (cords?|ties?|loops?))\b/i },
  { id: "toys-in-food", pattern: /\btoys? (inside|in) (the )?food\b|\bsurprises? that have to be eaten\b/i },
  { id: "chemical-toys", pattern: /\b(chemistry sets?|embedding kits?)\b/i },
  { id: "electrical-hazard", pattern: /\b(hoverboards?|exposed (chargers?|wires?))\b/i },
];

const YOUNG_EXTRA: { id: string; pattern: RegExp }[] = [
  { id: "tiny-figures", pattern: /\btiny figures?\b/i },
  { id: "loose-beads", pattern: /\bloose beads?\b/i },
];

/** Worker never-suggest list. age under 4 (or missing) tightens the filter. */
export function neverSuggestReason(text: string, age?: number): string | undefined {
  const lowered = text.trim();
  if (!lowered) return undefined;
  for (const rule of NEVER_SUGGEST) {
    if (rule.pattern.test(lowered)) return `item is on the never-suggest list (${rule.id})`;
  }
  if (age === undefined || age < 4) {
    for (const rule of YOUNG_EXTRA) {
      if (rule.pattern.test(lowered)) return `item is on the never-suggest list (${rule.id})`;
    }
  }
  return undefined;
}


function hasBrand(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const brand of BRANDS) {
    const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lower)) return brand;
  }
  return undefined;
}

function hasViolence(text: string): string | undefined {
  for (const word of VIOLENCE) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return word;
  }
  return undefined;
}

function problemIn(value: string, max: number, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is empty`;
  if (trimmed.length > max) return `${label} is longer than ${max} characters`;
  if (/https?:\/\/|www\./i.test(trimmed)) return `${label} looks like a url`;
  if (/\S+@\S+/.test(trimmed)) return `${label} looks like an email`;
  if (/\b(?:\+?\d[\d\s()-]{7,})\b/.test(trimmed)) return `${label} looks like a phone number`;
  if (/[£$€]|\b(?:pounds?|dollars?|quid|gbp|usd)\b/i.test(trimmed)) return `${label} mentions a price`;
  const brand = hasBrand(trimmed);
  if (brand) return `${label} mentions the brand ${brand}`;
  const violent = hasViolence(trimmed);
  if (violent) return `${label} mentions ${violent}`;
  return undefined;
}

/** Worker item/reason filter. Rejects; it does not silently strip. */
export function filterItemAndReason(item: string, reason?: string, age?: number): string | undefined {
  const itemProblem = problemIn(item, ITEM_MAX, "item");
  if (itemProblem) return itemProblem;
  const unsafe = neverSuggestReason(item, age);
  if (unsafe) return unsafe;
  if (reason !== undefined && reason.trim()) {
    return problemIn(reason, REASON_MAX, "reason");
  }
  return undefined;
}

export function brandsIn(text: string): string[] {
  const found: string[] = [];
  for (const brand of BRANDS) {
    const pattern = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(text)) found.push(brand);
  }
  return found;
}

export function mentionsPrice(text: string): boolean {
  return /[£$€]|\b(?:\d+\s*)?(?:pounds?|dollars?|quid|gbp|usd)\b/i.test(text);
}

export { BRANDS };
