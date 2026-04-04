import { connect } from "@tursodatabase/serverless";
import {
  type DataStoreValue,
  type SnapDataStore,
  type SnapFunction,
} from "@farcaster/snap";

/** Reserved for future options (e.g. custom table name). */
export type WithTursoServerlessOptions = Record<string, never>;

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS snap_kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)`;

/**
 * Wraps a SnapFunction and injects a Turso serverless-backed data store into the
 * context.
 */
export function withTursoServerless(
  snapFn: SnapFunction,
  _options?: WithTursoServerlessOptions,
): SnapFunction {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.warn("missing env vars -- skipping Turso data store setup");
    return snapFn;
  }

  const conn = connect({ url, authToken });

  let ensureTablePromise: Promise<void> | undefined;

  const ensureTable = async (): Promise<void> => {
    if (!ensureTablePromise) {
      ensureTablePromise = conn.execute(TABLE_SQL).then(() => undefined);
    }
    await ensureTablePromise;
  };

  const store: SnapDataStore = {
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

  return (ctx) => snapFn({ ...ctx, data: store });
}
