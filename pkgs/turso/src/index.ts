import { connect } from "@tursodatabase/serverless";
import {
  type SnapFunction,
  type SnapHandlerResult,
  type SnapContext,
} from "@farcaster/snap";

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS snap_kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;

export type DataStoreValue =
  | string
  | number
  | boolean
  | null
  | DataStoreValue[]
  | { [key: string]: DataStoreValue };

export type DataStore = {
  get(key: string): Promise<DataStoreValue | null>;
  set(key: string, value: DataStoreValue): Promise<void>;
};

export type SnapFunctionWithDataStore = (
  ctx: SnapContext & { data: DataStore },
) => Promise<SnapHandlerResult>;

export function createInMemoryDataStore(): DataStore {
  const data = new Map<string, DataStoreValue>();
  return {
    async get(key: string): Promise<DataStoreValue | null> {
      return data.get(key) ?? null;
    },
    async set(key: string, value: DataStoreValue): Promise<void> {
      data.set(key, value);
    },
  };
}

export function createTursoDataStore(): DataStore {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.warn("missing Turso env vars -- using in-memory data store");
    return createInMemoryDataStore();
  }

  const conn = connect({ url, authToken });

  let ensureTablePromise: Promise<void> | undefined;

  const ensureTable = async (): Promise<void> => {
    if (!ensureTablePromise) {
      ensureTablePromise = conn.execute(TABLE_SQL).then(() => undefined);
    }
    await ensureTablePromise;
  };

  return {
    async get(key: string): Promise<DataStoreValue | null> {
      await ensureTable();
      const stmt = await conn.prepare(
        "SELECT value FROM snap_kv WHERE key = ?",
      );
      const row = await stmt.get([key]);
      if (row == null) {
        return null;
      }
      const text =
        typeof row === "object" &&
        row !== null &&
        "value" in row &&
        typeof (row as { value: unknown }).value === "string"
          ? (row as { value: string }).value
          : String(row);
      return JSON.parse(text) as DataStoreValue;
    },
    async set(key: string, value: DataStoreValue): Promise<void> {
      await ensureTable();
      const stmt = await conn.prepare(
        "INSERT OR REPLACE INTO snap_kv (key, value) VALUES (?, ?)",
      );
      await stmt.run([key, JSON.stringify(value)]);
    },
  };
}
