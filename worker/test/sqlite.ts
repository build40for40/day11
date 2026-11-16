import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sql } from "../src/sql.js";

export function memorySql(): Sql {
  const db = new DatabaseSync(":memory:");
  db.exec("pragma foreign_keys = on");
  const migration = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../migrations/0001_init.sql"), "utf8");
  db.exec(migration);
  return {
    async run(query, ...args) {
      const result = db.prepare(query).run(...(args as never[]));
      return { changes: Number(result.changes ?? 0) };
    },
    async all(query, ...args) {
      return db.prepare(query).all(...(args as never[])) as never[];
    },
    async get(query, ...args) {
      return db.prepare(query).get(...(args as never[])) as never;
    },
  };
}
