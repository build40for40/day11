import type { Env } from "./session";

export { DeviceSession } from "./session";
export { Wand } from "./wand";

const ROUTES = new Set(["/ws", "/glissen/api/ws"]);
const DEVICE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const encoder = new TextEncoder();

function presentedToken(request: Request, url: URL): string | null {
  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length).trim();
  return url.searchParams.get("token");
}

function matches(token: string, expected: string): boolean {
  const a = encoder.encode(token);
  const b = encoder.encode(expected);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!ROUTES.has(url.pathname)) return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }
    const token = presentedToken(request, url);
    if (!env.DEVICE_TOKEN || !token || !matches(token, env.DEVICE_TOKEN)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const device = url.searchParams.get("device");
    if (!device || !DEVICE_ID.test(device)) return new Response("Missing or invalid device", { status: 400 });
    return env.SESSIONS.get(env.SESSIONS.idFromName(device)).fetch(request);
  },
} satisfies ExportedHandler<Env>;
