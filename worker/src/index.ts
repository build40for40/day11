import { handleRequest, type SessionHub } from "./app.js";
import { emailSender } from "./email.js";
import { fromD1 } from "./sql.js";
import { SessionDurableObject, type WorkerEnv } from "./session-do.js";

export { SessionDurableObject };

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method === "GET" && new URL(request.url).pathname === "/ws") {
      if (!env.DEVICE_TOKEN || request.headers.get("authorization") !== `Bearer ${env.DEVICE_TOKEN}`) {
        return new Response("unauthorized", { status: 401 });
      }
      const device = new URL(request.url).searchParams.get("device") ?? "";
      if (!device) return new Response("device required", { status: 400 });
      const id = env.SESSION.idFromName(device);
      return env.SESSION.get(id).fetch(request);
    }
    const session: SessionHub = {
      async notifyWaiting(deviceId, kidName, expiresAt) {
        const id = env.SESSION.idFromName(deviceId);
        await env.SESSION.get(id).fetch(
          new Request("https://session/open", {
            method: "POST",
            body: JSON.stringify({ kid_name: kidName, expires_at: expiresAt }),
          }),
        );
      },
    };
    return handleRequest(request, {
      sql: fromD1(env.DB),
      adminToken: env.ADMIN_TOKEN,
      deviceToken: env.DEVICE_TOKEN,
      uidSalt: env.UID_SALT,
      publicBaseUrl: env.PUBLIC_BASE_URL || "http://127.0.0.1:8787",
      email: emailSender(env),
      session,
      now: () => new Date(),
    });
  },
};
