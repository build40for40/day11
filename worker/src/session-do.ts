import { fromD1, type D1Like } from "./sql.js";
import { onWandTap, waitingMessage } from "./device.js";

export interface WorkerEnv {
  DB: D1Like;
  UID_SALT: string;
  DEVICE_TOKEN: string;
  ADMIN_TOKEN: string;
  PUBLIC_BASE_URL: string;
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  EMAIL_DEV_PRINT?: string;
  SESSION: DurableObjectNamespace;
}

export class SessionDurableObject {
  private sockets = new Set<WorkerSocket>();

  constructor(
    private readonly ctx: DurableObjectState,
    private readonly env: WorkerEnv,
  ) {
    void ctx;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/open" && request.method === "POST") {
      const body = (await request.json()) as { kid_name: string; expires_at: string };
      const message = waitingMessage(body.kid_name, body.expires_at, new Date());
      for (const socket of this.sockets) socket.send(JSON.stringify(message));
      return new Response("ok");
    }
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 400 });
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sockets.add(server);
    const deviceId = url.searchParams.get("device") ?? "";
    server.addEventListener("message", (event) => {
      void this.onMessage(deviceId, String(event.data ?? ""), server);
    });
    server.addEventListener("close", () => this.sockets.delete(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  private async onMessage(deviceId: string, raw: string, socket: WorkerSocket): Promise<void> {
    let body: { t?: string; uid?: string };
    try {
      body = JSON.parse(raw) as { t?: string; uid?: string };
    } catch {
      return;
    }
    if (body.t !== "nfc") return;
    const messages = await onWandTap(fromD1(this.env.DB), deviceId, body.uid, this.env.UID_SALT, new Date());
    for (const message of messages) socket.send(JSON.stringify(message));
  }
}
