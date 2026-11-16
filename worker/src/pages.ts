import { ARE_YOU_REAL, IS_SANTA_REAL, DEFAULT_GROWNUP } from "./copy.js";
import type { Kid } from "./db.js";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function page(title: string, body: string, pollUrl: string | null): string {
  const script = pollUrl
    ? `<script>
const statusUrl = ${JSON.stringify(pollUrl)};
async function refresh() {
  const response = await fetch(statusUrl, { headers: { accept: "application/json" } });
  if (!response.ok) return;
  const data = await response.json();
  for (const kid of data.kids || []) {
    const node = document.querySelector('[data-kid="' + kid.id + '"]');
    if (!node) continue;
    node.textContent = kid.first_name + ": " + kid.label;
  }
}
refresh();
setInterval(refresh, 2000);
</script>`
    : "";
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font: 1.05rem/1.45 Georgia, serif; margin: 0; background: #fffaf3; color: #2b2118; }
    main { max-width: 28rem; margin: 0 auto; padding: 1.25rem; }
    h1 { font-size: 1.6rem; line-height: 1.2; }
    label { display: block; margin: 0.9rem 0 0.25rem; font-weight: 700; }
    input, select { width: 100%; box-sizing: border-box; font: 1rem/1.3 sans-serif; padding: 0.7rem; }
    button { margin-top: 1rem; font: 1.05rem sans-serif; padding: 0.8rem 1rem; background: #8a3b2b; color: white; border: 0; border-radius: 999px; }
    .tick { font-weight: 400; display: flex; gap: 0.6rem; align-items: flex-start; }
    .tick input { width: auto; margin-top: 0.25rem; }
    blockquote { background: white; border-left: 4px solid #d4a017; margin: 0.5rem 0; padding: 0.6rem 0.8rem; }
    .error { background: #fde8e4; padding: 0.6rem 0.8rem; }
    .waiting { font-size: 1.25rem; }
  </style>
</head>
<body>
<main>
${body}
</main>
${script}
</body>
</html>`;
}

export function setupForm(opts: {
  error?: string;
  csrf: string;
  email?: string;
  name?: string;
  age?: string;
  grownup?: string;
  holiday?: string;
  device?: string;
}): string {
  const holiday = opts.holiday ?? "christmas";
  return page(
    "Set up Aunty Bella",
    `${opts.error ? `<p class="error">${escapeHtml(opts.error)}</p>` : ""}
    <h1>Hello. Let's set up Aunty Bella.</h1>
    <p>This page links your child's wand to you. We do not save recordings of their voice, and we do not keep a transcript.</p>
    <form method="post">
      <input type="hidden" name="csrf" value="${escapeHtml(opts.csrf)}">
      <label for="email">Your email</label>
      <input id="email" name="email" type="email" autocomplete="email" required value="${escapeHtml(opts.email ?? "")}">
      <label for="first_name">Child's first name</label>
      <input id="first_name" name="first_name" required maxlength="20" value="${escapeHtml(opts.name ?? "")}">
      <label for="age">Child's age</label>
      <input id="age" name="age" inputmode="numeric" required value="${escapeHtml(opts.age ?? "")}">
      <label for="grownup_label">What should Aunty Bella call you?</label>
      <input id="grownup_label" name="grownup_label" maxlength="20" value="${escapeHtml(opts.grownup ?? DEFAULT_GROWNUP)}">
      <label for="holiday_mode">What sort of list is this?</label>
      <select id="holiday_mode" name="holiday_mode">
        <option value="christmas" ${holiday === "christmas" ? "selected" : ""}>Christmas, with Santa</option>
        <option value="festive" ${holiday === "festive" ? "selected" : ""}>Festive, without assuming Santa</option>
        <option value="wishlist" ${holiday === "wishlist" ? "selected" : ""}>Just a wishlist</option>
      </select>
      <label for="device_id">Which Aunty Bella robot?</label>
      <input id="device_id" name="device_id" required value="${escapeHtml(opts.device ?? "stackchan-01")}">
      <h2>Two answers we will not change</h2>
      <p>If your child asks "Are you real?"</p>
      <blockquote>${escapeHtml(ARE_YOU_REAL)}</blockquote>
      <p>If your child asks "Is Santa real?"</p>
      <blockquote>${escapeHtml(IS_SANTA_REAL)}</blockquote>
      <p>In a festive or plain wishlist she will not bring Santa up herself.</p>
      <label class="tick"><input type="checkbox" name="answers" value="yes"> I am happy with these two answers.</label>
      <label class="tick"><input type="checkbox" name="consent" value="yes"> I am the child's parent or carer, and I agree to them using Aunty Bella.</label>
      <label class="tick"><input type="checkbox" name="privacy" value="yes"> I have read that no audio is stored and no transcript is kept.</label>
      <button type="submit">Save and pair the wand</button>
    </form>`,
    null,
  );
}

export function waitingPage(
  kids: { id: string; first_name: string; label: string }[],
  csrf: string,
  deviceId: string,
  statusUrl: string,
): string {
  const list = kids
    .map((kid) => `<p class="waiting" data-kid="${escapeHtml(kid.id)}">${escapeHtml(kid.first_name)}: ${escapeHtml(kid.label)}</p>`)
    .join("");
  return page(
    "Tap the wand",
    `<h1>Tap the wand on Aunty Bella now.</h1>
    <p>She will glow a slow blue while she waits, for ten minutes. Hold the wand on her head until she nods and glows gold.</p>
    ${list}
    <h2>Another child?</h2>
    <form method="post" action="kids">
      <input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
      <input type="hidden" name="device_id" value="${escapeHtml(deviceId)}">
      <label for="first_name">First name</label>
      <input id="first_name" name="first_name" required maxlength="20">
      <label for="age">Age</label>
      <input id="age" name="age" inputmode="numeric" required>
      <button type="submit">Add this child and pair their wand</button>
    </form>
    <p>We have sent a confirmation link if your email is not confirmed yet. Lists stay held until you confirm.</p>`,
    statusUrl,
  );
}

export function verifyPage(ok: boolean): string {
  return page(
    ok ? "Email confirmed" : "Link not valid",
    ok
      ? `<h1>Thank you. This email is confirmed.</h1><p>Lists that were held can now be sent to you. We still do not keep recordings or transcripts.</p>`
      : `<h1>This confirmation link is not valid.</h1><p>It may already have been used. Ask us if you need a new one.</p>`,
    null,
  );
}

export function messagePage(title: string, text: string): string {
  return page(title, `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p>`, null);
}

export function kidLabel(status: string): string {
  if (status === "paired") return "wand linked";
  if (status === "waiting") return "waiting for a tap";
  if (status === "expired") return "the ten minutes ran out. Add them again to retry.";
  return "not paired yet";
}

export function statusLabel(kid: Kid, pairingStatus: string): string {
  return `${kid.first_name ?? "Child"}: ${kidLabel(pairingStatus)}`;
}
