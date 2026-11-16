import { DurableObject } from "cloudflare:workers";
import { addMemoryLine, NAME_MAX, oneLine, PROFILE_MAX, rewriteMemory, type WandRecord } from "./memory";

const KEY = "wand";

export class Wand extends DurableObject {
  load(): WandRecord | null {
    return this.ctx.storage.kv.get<WandRecord>(KEY) ?? null;
  }

  saveProfile(name: string, profile: string, wipeMemory: boolean): WandRecord | null {
    const cleanName = oneLine(name, NAME_MAX);
    if (!cleanName) return null;
    const record = {
      name: cleanName,
      profile: oneLine(profile, PROFILE_MAX),
      memory: wipeMemory ? "" : (this.load()?.memory ?? ""),
    };
    this.ctx.storage.kv.put(KEY, record);
    return record;
  }

  remember(line: string): void {
    const record = this.load();
    if (record) this.ctx.storage.kv.put(KEY, { ...record, memory: addMemoryLine(record.memory, line) });
  }

  rewriteMemory(text: string): void {
    const record = this.load();
    if (record) this.ctx.storage.kv.put(KEY, { ...record, memory: rewriteMemory(text) });
  }

  async erase(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
