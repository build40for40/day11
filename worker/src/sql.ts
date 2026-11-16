export interface Sql {
  run(sql: string, ...args: unknown[]): Promise<{ changes: number }>;
  all<T>(sql: string, ...args: unknown[]): Promise<T[]>;
  get<T>(sql: string, ...args: unknown[]): Promise<T | undefined>;
}

export interface D1Like {
  prepare(query: string): {
    bind(...args: unknown[]): {
      run(): Promise<{ meta?: { changes?: number } }>;
      all<T>(): Promise<{ results?: T[] }>;
      first<T>(): Promise<T | null>;
    };
  };
}

export function fromD1(db: D1Like): Sql {
  return {
    async run(query, ...args) {
      const result = await db.prepare(query).bind(...args).run();
      return { changes: result.meta?.changes ?? 0 };
    },
    async all(query, ...args) {
      const result = await db.prepare(query).bind(...args).all<Record<string, unknown>>();
      return (result.results ?? []) as never[];
    },
    async get(query, ...args) {
      const row = await db.prepare(query).bind(...args).first<Record<string, unknown>>();
      return (row ?? undefined) as never;
    },
  };
}
