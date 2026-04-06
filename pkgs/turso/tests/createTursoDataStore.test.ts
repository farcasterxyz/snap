import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connect } from "@tursodatabase/serverless";
import { createTursoDataStore } from "../src/index.js";

vi.mock("@tursodatabase/serverless", () => {
  return {
    connect: vi.fn(() => {
      const rows = new Map<string, string>();
      return {
        execute: vi.fn().mockResolvedValue(undefined),
        prepare: vi.fn().mockImplementation(async () => ({
          get: vi.fn().mockImplementation(async (args: unknown) => {
            const key = Array.isArray(args) ? (args as string[])[0] : undefined;
            if (key === undefined) return null;
            const json = rows.get(key);
            return json !== undefined ? { value: json } : null;
          }),
          run: vi.fn().mockImplementation(async (args: unknown) => {
            const arr = args as string[];
            const key = arr[0];
            const json = arr[1];
            if (key !== undefined && json !== undefined) {
              rows.set(key, json);
            }
          }),
        })),
      };
    }),
  };
});

const FAKE_URL = "libsql://fake-db-fakeorg.turso.io";
const FAKE_TOKEN = "fake-token";

describe("createTursoDataStore — without Turso credentials", () => {
  beforeEach(() => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses an in-memory store and does not call connect()", async () => {
    const store = createTursoDataStore();
    await store.set("k", 1);
    expect(await store.get("k")).toBe(1);
    expect(connect).not.toHaveBeenCalled();
  });
});

describe("createTursoDataStore — with Turso credentials", () => {
  beforeEach(() => {
    process.env.TURSO_DATABASE_URL = FAKE_URL;
    process.env.TURSO_AUTH_TOKEN = FAKE_TOKEN;
  });

  afterEach(() => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    vi.clearAllMocks();
  });

  it("returns a Turso-backed store with working get and set", async () => {
    const store = createTursoDataStore();
    expect(connect).toHaveBeenCalledWith({
      url: FAKE_URL,
      authToken: FAKE_TOKEN,
    });

    await store.set("visits", 2);
    expect(await store.get("visits")).toBe(2);
  });
});
