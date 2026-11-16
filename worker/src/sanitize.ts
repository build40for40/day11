const LABEL = /^[A-Za-z][A-Za-z]*([ -][A-Za-z]+)*$/;
export const LABEL_MAX = 20;

/** Letters, spaces and hyphens only, capped at 20. Rejects anything that could carry instructions. */
export function sanitiseLabel(input: unknown, max = LABEL_MAX): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > max) return null;
  if (!LABEL.test(trimmed)) return null;
  return trimmed;
}

export function sanitiseAge(input: unknown): number | null {
  const value = typeof input === "number" ? input : Number(String(input ?? "").trim());
  if (!Number.isInteger(value) || value < 3 || value > 7) return null;
  return value;
}

export function sanitiseEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export type HolidayMode = "christmas" | "festive" | "wishlist";

export function sanitiseHoliday(input: unknown): HolidayMode | null {
  if (input === "christmas" || input === "festive" || input === "wishlist") return input;
  return null;
}

export function sanitiseDeviceId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const id = input.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,40}$/.test(id)) return null;
  return id;
}

export function normaliseUid(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const uid = input.trim().toUpperCase().replace(/[:\s-]/g, "");
  if (!/^[0-9A-F]{8,32}$/.test(uid)) return null;
  return uid;
}
