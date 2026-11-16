interface D1Prepared {
  bind(...args: unknown[]): D1Prepared;
  run(): Promise<{ meta?: { changes?: number } }>;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1Prepared;
  exec(query: string): Promise<unknown>;
}

interface DurableObjectId {}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

interface DurableObjectState {
  acceptWebSocket?(socket: WebSocket): void;
}

interface WorkerSocket {
  accept(): void;
  send(data: string): void;
  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void;
}

declare class WebSocketPair {
  0: WorkerSocket;
  1: WorkerSocket;
}

interface ResponseInit {
  webSocket?: WorkerSocket;
}
