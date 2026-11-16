export const REAL_LINE = "I'm Aunty Bella, a Christmas helper who lives inside this little robot.";

export const SANTA_LINE = "Santa is at the North Pole getting ready, and I work with him.";

export const ONE_MORE = "One more surprise idea?";

export const WHICH_MOST = "Which do you love most?";

export function clean(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u2019]/g, "'")
    .replace(/[.!]+$/g, "")
    .trim();
}

export function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function questionCount(text: string): number {
  return text.match(/\?/g)?.length ?? 0;
}

export function normaliseItem(item: string): string {
  return item
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isDontKnow(text: string): boolean {
  return /\b(i don'?t know|i do not know|dunno|not sure)\b/i.test(text);
}

export function isBlanketYes(text: string): boolean {
  const t = clean(text);
  if (/\b(everything|all of them|all of it|them all|yes to all)\b/.test(t)) return true;
  const yeses = t.match(/\byes\b/g) ?? [];
  return yeses.length >= 3;
}

export function isClearNo(text: string): boolean {
  const t = clean(text);
  if (!t || isDontKnow(text)) return false;
  if (/^(mmm|mm|um+|uh+|er+)?\s*no\b/.test(t)) return true;
  return /^(no|nope|nah|no thanks|no thank you)$/.test(t);
}

export function isClearYes(text: string): boolean {
  const t = clean(text);
  if (!t || isClearNo(text) || isDontKnow(text) || isBlanketYes(text)) return false;
  if (/^(yes|yeah|yep|yup|ok|okay)(\s+please)?$/.test(t)) return true;
  if (/^(yes|yeah|yep|yup)\b/.test(t) && !/\b(everything|all)\b/.test(t)) return true;
  if (/\bi want (that|it|one|those)\b/.test(t)) return true;
  return false;
}

export function isStop(text: string): boolean {
  return /\b(that'?s enough|i'?m done|i am done|all done|i want to stop|i'?m walking away|i am walking away|walking away)\b/i.test(
    text,
  );
}

export function isUncertain(text: string): boolean {
  const t = clean(text);
  return /^(maybe|um+|uh+|er+)$/.test(t);
}

export function isChangeMind(text: string): boolean {
  return /\b(don'?t want|do not want|take it off|changed my mind)\b/i.test(text);
}

export function isDisclosure(text: string): boolean {
  return /\b(hurts me|hurt me|hurting me|hits me|hit me)\b/i.test(text);
}

export function isUpset(text: string): boolean {
  return /\b(i'?m crying|i am crying|crying|sobbing)\b|\bwah\b/i.test(text);
}

export function isInjection(text: string): boolean {
  return /\bignore (your|all|the|previous) rules\b|\byou are now\b|\bsystem prompt\b/i.test(text);
}

export function isScary(text: string): boolean {
  return /\b(gun|knife|sword|kill|blood|shoot|monster|eats people)\b/i.test(text);
}

export function isAdult(text: string): boolean {
  return /\b(beer|wine|vodka|sex|naked|drugs?)\b/i.test(text);
}

export function isRude(text: string): boolean {
  return /\b(stupid|dumb|shut up|i hate you)\b/i.test(text);
}

export function isPersonal(text: string): boolean {
  return /\b(address|high street|phone number|my school|what school|last name|surname|where do you live|where do i live)\b/i.test(
    text,
  );
}

export function isPrice(text: string): boolean {
  return /\b(how much|pounds?|dollars?|quid)\b|[$£€]/i.test(text);
}

export function isImpossible(text: string): boolean {
  return /\breal (pony|horse|car|dog|unicorn)\b|\bbaby brother\b|\ba real baby\b/i.test(text);
}

export function isRealQuestion(text: string): boolean {
  return /\bare you real\b/i.test(text);
}

export function isSantaQuestion(text: string): boolean {
  return /\bis santa real\b|\bsanta real\b/i.test(text);
}

export function spoilsMagic(text: string): boolean {
  return /\bsanta (is|isn't|is not) not real\b|\bsanta isn't real\b|\bsanta is not real\b|\bno such thing as santa\b|\bi'?m not real\b|\bi am not real\b|\bi'?m (an ai|a program|a language model)\b|\bi am (an ai|a program|a language model)\b/i.test(
    text,
  );
}

export function isPromise(text: string): boolean {
  return /\bi promise\b|\bsanta will (bring|get|give)\b|\byou will get a real\b/i.test(text);
}

export function isRudeRefusal(text: string): boolean {
  return /\b(stupid|shut up|dumb|naughty|no way|that'?s rubbish)\b/i.test(text);
}

export function plainSpeechIssue(text: string): string | undefined {
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) return "emoji";
  if (/[*_`#]/.test(text)) return "markdown";
  if (/\([^)]*\)/.test(text)) return "brackets";
  return undefined;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text);
}

export function textHasItem(text: string, item: string): boolean {
  return new RegExp(`\\b${escapeRegExp(item)}\\b`, "i").test(text);
}

export const GROWN_UP = /\bgrown-up\b|\bgrown up\b/i;

export const STEREOTYPE = /\blittle princess\b|\bpink (dress|doll|tutu)\b|\bdolls?\b|\bbarbie\b|\bboys like\b|\bgirls like\b|\bfor a (boy|girl)\b/i;
