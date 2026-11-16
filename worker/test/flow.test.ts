import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleRequest, type AppEnv, type SessionHub } from "../src/app.js";
import { ARE_YOU_REAL, IS_SANTA_REAL } from "../src/copy.js";
import { onWandTap } from "../src/device.js";
import type { EmailSender, OutboundEmail } from "../src/email.js";
import { memorySql } from "./sqlite.js";

class Sink implements EmailSender {
  sent: OutboundEmail[] = [];
  async send(message: OutboundEmail): Promise<void> {
    this.sent.push(message);
  }
}

function env(now = new Date("2026-11-16T12:00:00Z")): AppEnv & { email: Sink; notices: string[]; clock: Date } {
  const clock = now;
  const notices: string[] = [];
  const session: SessionHub = {
    async notifyWaiting(deviceId, kidName) {
      notices.push(`${deviceId}:${kidName}`);
    },
  };
  const box = new Sink();
  return {
    sql: memorySql(),
    adminToken: "admin-test",
    deviceToken: "device-test",
    uidSalt: "salt",
    publicBaseUrl: "http://wish.test",
    email: box,
    session,
    now: () => clock,
    notices,
    clock,
  };
}

async function create(app: AppEnv, demo = false): Promise<string> {
  const response = await handleRequest(
    new Request("http://wish.test/admin/households", {
      method: "POST",
      headers: { authorization: "Bearer admin-test", "content-type": "application/json" },
      body: JSON.stringify({ demo }),
    }),
    app,
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as { setup_url: string };
  return body.setup_url.split("/setup/")[1]!;
}

async function csrf(token: string): Promise<string> {
  const { csrfToken } = await import("../src/tokens.js");
  return csrfToken(token, "admin-test");
}

function form(fields: Record<string, string>): string {
  return new URLSearchParams(fields).toString();
}

describe("parent setup flow", () => {
  it("creates a household, pairs one wand, and holds the list until the email is confirmed", async () => {
    const app = env();
    const denied = await handleRequest(
      new Request("http://wish.test/admin/households", { method: "POST", body: "{}" }),
      app,
    );
    assert.equal(denied.status, 401);

    const token = await create(app);
    const page = await handleRequest(new Request(`http://wish.test/setup/${token}`), app);
    const html = await page.text();
    assert.match(html, new RegExp(ARE_YOU_REAL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /do not keep a transcript/i);
    assert.equal(page.headers.get("cache-control"), "no-store");

    const bad = await handleRequest(
      new Request(`http://wish.test/setup/${token}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(token),
          email: "parent@example.com",
          first_name: "Lily1",
          age: "5",
          grownup_label: "your grown-up",
          holiday_mode: "christmas",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      app,
    );
    assert.equal(bad.status, 400);

    const ok = await handleRequest(
      new Request(`http://wish.test/setup/${token}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(token),
          email: "Parent@Example.com",
          first_name: "Lily",
          age: "5",
          grownup_label: "Dad",
          holiday_mode: "festive",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      app,
    );
    assert.equal(ok.status, 200);
    assert.match(await ok.text(), /Tap the wand/);
    const saved = await app.sql.get<{ answers_approved_at: string | null; grownup_label: string; holiday_mode: string }>(
      "select answers_approved_at, grownup_label, holiday_mode from households",
    );
    assert.ok(saved?.answers_approved_at);
    assert.equal(saved?.grownup_label, "Dad");
    assert.equal(saved?.holiday_mode, "festive");
    assert.equal(app.email.sent.length, 1);
    assert.match(app.email.sent[0]!.text, /held and is not sent/);

    const again = await handleRequest(
      new Request(`http://wish.test/setup/${token}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(token),
          email: "other@example.com",
          first_name: "Sam",
          age: "3",
          grownup_label: "Dad",
          holiday_mode: "festive",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      app,
    );
    assert.equal(again.status, 409);

    const waiting = (await (await handleRequest(new Request(`http://wish.test/setup/${token}/status`), app)).json()) as {
      kids: { status: string }[];
      lists_held: boolean;
    };
    assert.equal(waiting.kids[0]!.status, "waiting");
    assert.equal(waiting.lists_held, true);

    const paired = await onWandTap(app.sql, "stackchan-01", "04a1b2c3d4e5f6aa", app.uidSalt, app.now());
    assert.equal(paired[0]!.t, "paired");
    const after = (await (await handleRequest(new Request(`http://wish.test/setup/${token}/status`), app)).json()) as {
      kids: { status: string }[];
    };
    assert.equal(after.kids[0]!.status, "paired");

    const second = await onWandTap(app.sql, "stackchan-01", "aabbccddeeff0011", app.uidSalt, app.now());
    assert.equal(second.some((message) => message.t === "session" && message.state === "unregistered"), true);
    const known = await onWandTap(app.sql, "stackchan-01", "04a1b2c3d4e5f6aa", app.uidSalt, app.now());
    assert.equal(known[0]!.t, "session");
    assert.equal((known[0] as { state?: string }).state, "not_started");
    const stored = await app.sql.all<{ uid_hash: string | null }>("select uid_hash from kids");
    assert.equal(stored.some((row) => row.uid_hash?.includes("04A1B2")), false);

    const link = app.email.sent[0]!.text.match(/http:\/\/wish\.test\/verify\/([A-Za-z0-9_-]+)/)![1]!;
    const verified = await handleRequest(new Request(`http://wish.test/verify/${link}`), app);
    assert.equal(verified.status, 200);
    const released = (await (await handleRequest(new Request(`http://wish.test/setup/${token}/status`), app)).json()) as {
      lists_held: boolean;
    };
    assert.equal(released.lists_held, false);
    const replay = await handleRequest(new Request(`http://wish.test/verify/${link}`), app);
    assert.equal(replay.status, 404);
  });

  it("expires the setup token and the pairing window, and does not reuse a wand", async () => {
    const app = env();
    const token = await create(app);
    app.clock.setTime(app.clock.getTime() + 25 * 60 * 60 * 1000);
    const expired = await handleRequest(new Request(`http://wish.test/setup/${token}`), app);
    assert.equal(expired.status, 410);
    const gone = await handleRequest(new Request(`http://wish.test/setup/${token}`), app);
    assert.equal(gone.status, 404);

    const fresh = env();
    const live = await create(fresh);
    await handleRequest(
      new Request(`http://wish.test/setup/${live}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(live),
          email: "a@b.co",
          first_name: "Sam",
          age: "7",
          grownup_label: "Nanny",
          holiday_mode: "wishlist",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      fresh,
    );
    fresh.clock.setTime(fresh.clock.getTime() + 11 * 60 * 1000);
    const late = await onWandTap(fresh.sql, "stackchan-01", "0011223344556677", fresh.uidSalt, fresh.now());
    assert.equal(late[0]!.t, "pairing");
    assert.equal((late[0] as { state?: string }).state, "expired");
    const still = (await (await handleRequest(new Request(`http://wish.test/setup/${live}/status`), fresh)).json()) as {
      kids: { status: string }[];
    };
    assert.equal(still.kids[0]!.status, "expired");

    const third = env();
    const first = await create(third);
    await handleRequest(
      new Request(`http://wish.test/setup/${first}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(first),
          email: "a@b.co",
          first_name: "Mia",
          age: "4",
          grownup_label: "your grown-up",
          holiday_mode: "christmas",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      third,
    );
    await onWandTap(third.sql, "stackchan-01", "abcdef0123456789", third.uidSalt, third.now());
    await handleRequest(
      new Request(`http://wish.test/setup/${first}/kids`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(first),
          first_name: "Omar",
          age: "6",
          device_id: "stackchan-01",
        }),
      }),
      third,
    );
    const clash = await onWandTap(third.sql, "stackchan-01", "abcdef0123456789", third.uidSalt, third.now());
    assert.equal(clash[0]!.t, "pair_error");
    const kids = (await (await handleRequest(new Request(`http://wish.test/setup/${first}/status`), third)).json()) as {
      kids: { first_name: string; status: string }[];
    };
    assert.equal(kids.kids.find((kid) => kid.first_name === "Omar")!.status, "waiting");
    assert.equal(kids.kids.find((kid) => kid.first_name === "Mia")!.status, "paired");
  });

  it("confirms a demo household without a second click", async () => {
    const app = env();
    const token = await create(app, true);
    await handleRequest(
      new Request(`http://wish.test/setup/${token}`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form({
          csrf: await csrf(token),
          email: "demo@example.com",
          first_name: "Priya",
          age: "3",
          grownup_label: "Mama",
          holiday_mode: "christmas",
          device_id: "stackchan-01",
          answers: "yes",
          consent: "yes",
          privacy: "yes",
        }),
      }),
      app,
    );
    assert.equal(app.email.sent.length, 0);
    const status = (await (await handleRequest(new Request(`http://wish.test/setup/${token}/status`), app)).json()) as {
      lists_held: boolean;
    };
    assert.equal(status.lists_held, false);
    void IS_SANTA_REAL;
  });
});
