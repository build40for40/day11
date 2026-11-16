export const SETUP_TTL_MS = 24 * 60 * 60 * 1000;
export const PAIRING_TTL_MS = 10 * 60 * 1000;

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

export function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function uidHash(uid: string, salt: string): Promise<string> {
  return sha256(`${salt}${uid}`);
}

export async function csrfToken(setupToken: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`csrf:${setupToken}`));
  return base64url(new Uint8Array(sig));
}

export async function csrfOk(setupToken: string, secret: string, presented: unknown): Promise<boolean> {
  if (typeof presented !== "string" || !presented) return false;
  const expected = await csrfToken(setupToken, secret);
  return timingSame(expected, presented);
}

function timingSame(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
