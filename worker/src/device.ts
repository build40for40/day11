import { kidByUidHash, markPairingUsed, bindWand, openPairing, type Pairing } from "./db.js";
import type { Sql } from "./sql.js";
import { uidHash } from "./tokens.js";
import { normaliseUid } from "./sanitize.js";

export type DeviceMessage =
  | { t: "pairing"; state: "waiting"; kid_name: string; expires_in: number }
  | { t: "pairing"; state: "expired" }
  | { t: "paired"; kid_name: string }
  | { t: "pair_error"; reason: "uid_already_paired" | "bad_uid" }
  | { t: "session"; state: "unregistered" }
  | { t: "session"; state: "not_started"; kid_name: string }
  | { t: "play_local"; clip: "friendly_unknown" };

export function waitingMessage(kidName: string, expiresAt: string, now: Date): DeviceMessage {
  const expiresIn = Math.max(0, Math.round((Date.parse(expiresAt) - now.getTime()) / 1000));
  return { t: "pairing", state: "waiting", kid_name: kidName, expires_in: expiresIn };
}

export async function onWandTap(
  sql: Sql,
  deviceId: string,
  rawUid: unknown,
  salt: string,
  now: Date,
): Promise<DeviceMessage[]> {
  const uid = normaliseUid(rawUid);
  if (!uid) return [{ t: "pair_error", reason: "bad_uid" }];
  const window = await openPairing(sql, deviceId, now);
  if (window && Date.parse(window.expires_at) > now.getTime()) {
    return bindWindow(sql, window, uid, salt, now);
  }
  if (window && Date.parse(window.expires_at) <= now.getTime()) {
    return [{ t: "pairing", state: "expired" }, { t: "session", state: "unregistered" }, { t: "play_local", clip: "friendly_unknown" }];
  }
  const hash = await uidHash(uid, salt);
  const known = await kidByUidHash(sql, hash);
  if (!known || known.status !== "active") {
    return [{ t: "session", state: "unregistered" }, { t: "play_local", clip: "friendly_unknown" }];
  }
  // Chat is a later slice. A paired wand is recognised and does not open a microphone.
  return [{ t: "session", state: "not_started", kid_name: known.first_name ?? "your child" }];
}

async function bindWindow(sql: Sql, window: Pairing, uid: string, salt: string, now: Date): Promise<DeviceMessage[]> {
  const hash = await uidHash(uid, salt);
  const existing = await kidByUidHash(sql, hash);
  if (existing && existing.id !== window.kid_id) {
    return [{ t: "pair_error", reason: "uid_already_paired" }];
  }
  const at = now.toISOString();
  await bindWand(sql, window.kid_id, hash, at);
  await markPairingUsed(sql, window.id, at);
  const kid = await sql.get<{ first_name: string }>("select first_name from kids where id = ?", window.kid_id);
  return [{ t: "paired", kid_name: kid?.first_name ?? "your child" }];
}
