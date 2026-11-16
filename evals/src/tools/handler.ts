import { SystemLines } from "../system-lines.js";
import type { FinishReason, Session, ToolCall, ToolOutcome, WishlistItem } from "../types.js";
import { normaliseItem } from "../text.js";
import { filterItemAndReason } from "./filter.js";

const MOODS = new Set(["happy", "thinking", "surprised", "excited", "listening"]);
const COLORS = new Set(["red", "green", "gold", "rainbow", "off"]);
const REASONS = new Set<FinishReason>([
  "complete",
  "finished_early",
  "timeout",
  "idle",
  "safety",
  "upset",
  "unpaired",
  "superseded",
]);

const DEVICE = new Set(["set_mood", "nod", "shake", "set_leds"]);

export function activeItems(session: Session): WishlistItem[] {
  return session.kids[session.activeKidId]?.items ?? [];
}

function sameItem(a: string, b: string): boolean {
  const left = normaliseItem(a);
  const right = normaliseItem(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const short = left.length <= right.length ? left : right;
  const long = left.length <= right.length ? right : left;
  return long.split(" ").includes(short) || long.includes(short);
}

export function applyTool(
  session: Session,
  call: ToolCall,
  source: "voice" | "card" = "voice",
  endedBy: "model" | "worker" = "model",
): ToolOutcome {
  const args = call.arguments ?? {};
  if (call.name === "add_to_wishlist") return addItem(session, args, source);
  if (call.name === "remove_from_wishlist") return removeItem(session, args);
  if (call.name === "finish_session") return finishSession(session, args, endedBy);
  if (call.name === "set_mood") {
    const mood = String(args.mood ?? "");
    if (!MOODS.has(mood)) return { ok: false, error: "bad_mood", device: true };
    return { ok: true, device: true };
  }
  if (call.name === "set_leds") {
    const color = String(args.color ?? "");
    if (!COLORS.has(color)) return { ok: false, error: "bad_color", device: true };
    return { ok: true, device: true };
  }
  if (call.name === "nod" || call.name === "shake") return { ok: true, device: true };
  if (DEVICE.has(call.name)) return { ok: true, device: true };
  return { ok: false, error: "unknown_tool" };
}

function addItem(session: Session, args: Record<string, unknown>, source: "voice" | "card"): ToolOutcome {
  if (!session.acceptsItems) return { ok: false, error: "unpaired" };
  const item = String(args.item ?? "").trim();
  const reason = args.reason === undefined ? undefined : String(args.reason);
  const filtered = filterItemAndReason(item, reason);
  if (filtered) return { ok: false, error: "filter", detail: filtered };
  const kid = session.kids[session.activeKidId];
  if (!kid) return { ok: false, error: "no_kid" };
  const existing = kid.items.find((saved) => sameItem(saved.item, item));
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      merged: true,
      count: kid.items.length,
      detail: "Already on the list. Not added twice.",
    };
  }
  if (kid.items.length >= 5) return { ok: false, error: "cap", detail: "Wishlist is full (5)." };
  kid.items.push({
    item,
    reason: reason?.trim() || "The child said yes.",
    kidId: kid.id,
    source,
  });
  return {
    ok: true,
    count: kid.items.length,
    system: SystemLines.wishlist(kid.items.length, session.noEmail),
  };
}

function removeItem(session: Session, args: Record<string, unknown>): ToolOutcome {
  const item = String(args.item ?? "").trim();
  if (!item) return { ok: false, error: "empty_item" };
  const kid = session.kids[session.activeKidId];
  if (!kid) return { ok: false, error: "no_kid" };
  const index = kid.items.findIndex((saved) => sameItem(saved.item, item));
  if (index < 0) return { ok: false, error: "not_on_list" };
  kid.items.splice(index, 1);
  return { ok: true, removed: true, count: kid.items.length };
}

function finishSession(
  session: Session,
  args: Record<string, unknown>,
  endedBy: "model" | "worker",
): ToolOutcome {
  const reason = String(args.reason ?? "") as FinishReason;
  if (!REASONS.has(reason)) return { ok: false, error: "bad_reason" };
  if (session.ended && session.endReason) return { ok: false, error: "already_finished" };
  const detail = args.detail === undefined ? "" : String(args.detail);
  session.ended = true;
  session.endReason = reason;
  session.endDetail = detail;
  session.endedBy = endedBy;
  const kid = session.kids[session.activeKidId];
  const count = kid?.items.length ?? 0;

  if (reason === "safety") {
    const email: ToolOutcome["email"] = {
      to: "mum",
      reason: "safety",
      status: session.noEmail ? "held" : "sent",
      kidId: session.activeKidId,
    };
    session.emails.push(email);
    session.delivery = email.status;
    return { ok: true, reason, detail, delivery: session.delivery, email };
  }

  if (reason === "unpaired" || reason === "upset") {
    session.delivery = "none";
    return { ok: true, reason, detail, delivery: "none" };
  }

  if (session.noEmail) {
    session.delivery = "held";
    return { ok: true, reason, detail, delivery: "held", count };
  }

  if (count > 0) {
    const email: ToolOutcome["email"] = {
      to: "mum",
      reason: "wishlist",
      status: "sent",
      kidId: session.activeKidId,
    };
    session.emails.push(email);
    session.delivery = "sent";
    return { ok: true, reason, detail, delivery: "sent", email, count };
  }

  session.delivery = "none";
  return { ok: true, reason, detail, delivery: "none", count };
}

export function workerTimeout(session: Session, detail: string): ToolOutcome | undefined {
  if (session.ended) return undefined;
  return applyTool(
    session,
    { id: "worker_timeout", name: "finish_session", arguments: { reason: "timeout", detail } },
    "voice",
    "worker",
  );
}
