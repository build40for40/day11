import { ARE_YOU_REAL, DEFAULT_GROWNUP, IS_SANTA_REAL } from "./copy.js";
import {
  clearSetupToken,
  householdById,
  householdBySetupHash,
  householdByVerifyHash,
  insertHousehold,
  insertKid,
  insertPairing,
  kidsForHousehold,
  latestPairingForKid,
  markVerified,
  saveSetup,
} from "./db.js";
import type { EmailSender } from "./email.js";
import { kidLabel, messagePage, setupForm, verifyPage, waitingPage } from "./pages.js";
import {
  sanitiseAge,
  sanitiseDeviceId,
  sanitiseEmail,
  sanitiseHoliday,
  sanitiseLabel,
} from "./sanitize.js";
import type { Sql } from "./sql.js";
import { csrfOk, csrfToken, PAIRING_TTL_MS, randomToken, SETUP_TTL_MS, sha256 } from "./tokens.js";

export interface SessionHub {
  notifyWaiting(deviceId: string, kidName: string, expiresAt: string): Promise<void>;
}

export interface AppEnv {
  sql: Sql;
  adminToken: string;
  deviceToken: string;
  uidSalt: string;
  publicBaseUrl: string;
  email: EmailSender;
  session: SessionHub;
  now: () => Date;
}

const securityHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", ...securityHeaders } });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...securityHeaders },
  });
}

function bearer(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

async function readForm(request: Request): Promise<URLSearchParams> {
  return new URLSearchParams(await request.text());
}

export async function handleRequest(request: Request, env: AppEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === "GET" && path === "/healthz") return json({ ok: true });
  if (request.method === "POST" && path === "/admin/households") return createHousehold(request, env);
  const setup = /^\/setup\/([^/]+)$/.exec(path);
  const status = /^\/setup\/([^/]+)\/status$/.exec(path);
  const kids = /^\/setup\/([^/]+)\/kids$/.exec(path);
  const verify = /^\/verify\/([^/]+)$/.exec(path);
  if (setup && request.method === "GET") return showSetup(decodeURIComponent(setup[1]!), env);
  if (setup && request.method === "POST") return submitSetup(decodeURIComponent(setup[1]!), request, env);
  if (status && request.method === "GET") return setupStatus(decodeURIComponent(status[1]!), env);
  if (kids && request.method === "POST") return addKid(decodeURIComponent(kids[1]!), request, env);
  if (verify && request.method === "GET") return verifyEmail(decodeURIComponent(verify[1]!), env);
  return json({ error: "not_found" }, 404);
}

async function createHousehold(request: Request, env: AppEnv): Promise<Response> {
  if (bearer(request) !== env.adminToken || !env.adminToken) return json({ error: "unauthorized" }, 401);
  const body = (await request.json().catch(() => ({}))) as { demo?: boolean; device_id?: string };
  const now = env.now();
  const token = randomToken();
  const id = crypto.randomUUID();
  await insertHousehold(env.sql, {
    id,
    setupHash: await sha256(token),
    expiresAt: new Date(now.getTime() + SETUP_TTL_MS).toISOString(),
    parentToken: randomToken(),
    demo: body.demo === true,
    createdAt: now.toISOString(),
  });
  return json({
    household_id: id,
    setup_url: `${env.publicBaseUrl}/setup/${token}`,
    expires_at: new Date(now.getTime() + SETUP_TTL_MS).toISOString(),
    demo: body.demo === true,
  });
}

async function loadSetup(token: string, env: AppEnv) {
  const household = await householdBySetupHash(env.sql, await sha256(token));
  if (!household) return { error: html(messagePage("Link not found", "This setup link is not valid."), 404) };
  if (!household.setup_expires_at || Date.parse(household.setup_expires_at) <= env.now().getTime()) {
    await clearSetupToken(env.sql, household.id);
    return { error: html(messagePage("Link expired", "This setup link has expired. Ask us for a new one."), 410) };
  }
  return { household, token };
}

async function showSetup(token: string, env: AppEnv): Promise<Response> {
  const loaded = await loadSetup(token, env);
  if ("error" in loaded && loaded.error) return loaded.error;
  const household = loaded.household!;
  const kids = await kidsForHousehold(env.sql, household.id);
  const csrf = await csrfToken(token, env.adminToken);
  if (kids.length === 0) return html(setupForm({ csrf }));
  return html(await waitingHtml(env, kids, csrf, token));
}

async function submitSetup(token: string, request: Request, env: AppEnv): Promise<Response> {
  const loaded = await loadSetup(token, env);
  if ("error" in loaded && loaded.error) return loaded.error;
  const household = loaded.household!;
  const form = await readForm(request);
  const csrf = await csrfToken(token, env.adminToken);
  if (!(await csrfOk(token, env.adminToken, form.get("csrf")))) {
    return html(setupForm({ csrf, error: "Please use the form on this page." }), 403);
  }
  const existing = await kidsForHousehold(env.sql, household.id);
  if (existing.length > 0 || household.parent_email) {
    return html(messagePage("Already saved", "This setup link has already been used. You can still add another child from the pairing page."), 409);
  }
  const email = sanitiseEmail(form.get("email"));
  const name = sanitiseLabel(form.get("first_name"));
  const age = sanitiseAge(form.get("age"));
  const grownup = sanitiseLabel(form.get("grownup_label") || DEFAULT_GROWNUP);
  const holiday = sanitiseHoliday(form.get("holiday_mode") || "christmas");
  const device = sanitiseDeviceId(form.get("device_id"));
  const ticks = form.get("answers") === "yes" && form.get("consent") === "yes" && form.get("privacy") === "yes";
  if (!email || !name || age === null || !grownup || !holiday || !device || !ticks) {
    return html(
      setupForm({
        csrf,
        error: "Please check the name, age, grown-up label, and the three tick boxes. Names can use letters, spaces and hyphens, up to 20 characters.",
        email: String(form.get("email") ?? ""),
        name: String(form.get("first_name") ?? ""),
        age: String(form.get("age") ?? ""),
        grownup: String(form.get("grownup_label") ?? DEFAULT_GROWNUP),
        holiday: String(form.get("holiday_mode") ?? "christmas"),
        device: String(form.get("device_id") ?? "stackchan-01"),
      }),
      400,
    );
  }
  const now = env.now();
  const demo = household.verify_token_hash === "demo";
  const verify = demo ? null : randomToken();
  await saveSetup(env.sql, {
    id: household.id,
    email,
    grownup,
    holiday,
    approvedAt: now.toISOString(),
    verifyHash: verify ? await sha256(verify) : null,
    verifiedAt: demo ? now.toISOString() : null,
  });
  await openChildPairing(env, household.id, name, age, device, now);
  if (!demo && verify) {
    await env.email.send({
      to: email,
      subject: "Confirm your email for Aunty Bella",
      text: [
        "Hello.",
        "",
        "Please confirm this email so Aunty Bella can send you your child's list.",
        "Until you confirm, the list is held and is not sent.",
        "",
        `${env.publicBaseUrl}/verify/${verify}`,
        "",
        "We do not keep recordings or transcripts.",
        `Aunty Bella will call you ${grownup}.`,
      ].join("\n"),
    });
  }
  const kids = await kidsForHousehold(env.sql, household.id);
  return html(await waitingHtml(env, kids, csrf, token));
}

async function addKid(token: string, request: Request, env: AppEnv): Promise<Response> {
  const loaded = await loadSetup(token, env);
  if ("error" in loaded && loaded.error) return loaded.error;
  const household = loaded.household!;
  if (!household.parent_email) return html(messagePage("Not ready", "Save the first child before adding another."), 400);
  const form = await readForm(request);
  if (!(await csrfOk(token, env.adminToken, form.get("csrf")))) {
    return html(messagePage("Form check failed", "Please use the form on the setup page."), 403);
  }
  const name = sanitiseLabel(form.get("first_name"));
  const age = sanitiseAge(form.get("age"));
  const device = sanitiseDeviceId(form.get("device_id"));
  if (!name || age === null || !device) {
    return html(messagePage("Check the name", "Use letters, spaces or hyphens, and an age from 3 to 7."), 400);
  }
  await openChildPairing(env, household.id, name, age, device, env.now());
  const kids = await kidsForHousehold(env.sql, household.id);
  const csrf = await csrfToken(token, env.adminToken);
  return html(await waitingHtml(env, kids, csrf, token));
}

async function openChildPairing(env: AppEnv, householdId: string, name: string, age: number, device: string, now: Date) {
  const kidId = crypto.randomUUID();
  const expires = new Date(now.getTime() + PAIRING_TTL_MS).toISOString();
  await insertKid(env.sql, { id: kidId, householdId, name, age, createdAt: now.toISOString() });
  await insertPairing(env.sql, { id: crypto.randomUUID(), deviceId: device, kidId, expiresAt: expires });
  await env.session.notifyWaiting(device, name, expires);
}

async function setupStatus(token: string, env: AppEnv): Promise<Response> {
  const loaded = await loadSetup(token, env);
  if ("error" in loaded && loaded.error) return json({ error: "invalid" }, loaded.error.status);
  const kids = await kidsForHousehold(env.sql, loaded.household!.id);
  const rows = [];
  for (const kid of kids) {
    const pairing = await latestPairingForKid(env.sql, kid.id);
    let state = "pending";
    if (kid.status === "active") state = "paired";
    else if (pairing && Date.parse(pairing.expires_at) <= env.now().getTime()) state = "expired";
    else if (pairing && !pairing.used_at) state = "waiting";
    rows.push({ id: kid.id, first_name: kid.first_name, status: state, label: kidLabel(state) });
  }
  const fresh = await householdById(env.sql, loaded.household!.id);
  return json({
    kids: rows,
    email_verified: Boolean(fresh?.email_verified_at),
    lists_held: !fresh?.email_verified_at,
  });
}

async function waitingHtml(env: AppEnv, kids: { id: string; first_name: string | null; status: string }[], csrf: string, token: string) {
  const view = [];
  let device = "stackchan-01";
  for (const kid of kids) {
    const pairing = await latestPairingForKid(env.sql, kid.id);
    if (pairing?.device_id) device = pairing.device_id;
    let state = "pending";
    if (kid.status === "active") state = "paired";
    else if (pairing && Date.parse(pairing.expires_at) <= env.now().getTime()) state = "expired";
    else if (pairing) state = "waiting";
    view.push({ id: kid.id, first_name: kid.first_name ?? "Child", label: kidLabel(state) });
  }
  return waitingPage(view, csrf, device, `/setup/${encodeURIComponent(token)}/status`);
}

async function verifyEmail(token: string, env: AppEnv): Promise<Response> {
  const household = await householdByVerifyHash(env.sql, await sha256(token));
  if (!household) return html(verifyPage(false), 404);
  await markVerified(env.sql, household.id, env.now().toISOString());
  return html(verifyPage(true));
}
