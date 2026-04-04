import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  createDefaultDataStore,
  DEFAULT_THEME_ACCENT,
  type SnapContext,
  type SnapFunction,
} from "@farcaster/snap";

const minimalResponse = {
  version: "1.0" as const,
  page: {
    theme: { accent: DEFAULT_THEME_ACCENT },
    button_layout: "stack" as const,
    elements: {
      type: "stack" as const,
      children: [
        { type: "text" as const, style: "title" as const, content: "Hello" },
        {
          type: "text" as const,
          style: "body" as const,
          content: "Test snap.",
        },
      ],
    },
    buttons: [
      { label: "Go", action: "post" as const, target: "http://localhost/" },
    ],
  },
};

function makeCtx(): SnapContext {
  return {
    action: { type: "get" },
    request: new Request("http://localhost/"),
    data: createDefaultDataStore(),
  };
}

describe("createDefaultDataStore", () => {
  it("throws on get()", async () => {
    const store = createDefaultDataStore();
    await expect(store.get("key")).rejects.toThrow("not configured");
  });

  it("throws on set()", async () => {
    const store = createDefaultDataStore();
    await expect(store.set("key", "value")).rejects.toThrow("not configured");
  });
});

describe("withTursoServerless — no env vars", () => {
  beforeEach(() => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
  });

  it("returns the original snapFn and passes ctx through unchanged", async () => {
    const { withTursoServerless } = await import("../src/index.js");

    let capturedCtx: SnapContext | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedCtx = ctx;
      return minimalResponse;
    };

    const wrapped = withTursoServerless(snapFn);
    expect(wrapped).toBe(snapFn);

    const ctx = makeCtx();
    await wrapped(ctx);

    expect(capturedCtx).toBe(ctx);
  });
});

describe("withTursoServerless — with env vars", () => {
  const FAKE_URL = "libsql://fake-db-fakeorg.turso.io";
  const FAKE_TOKEN = "fake-token";

  beforeEach(() => {
    process.env.TURSO_DATABASE_URL = FAKE_URL;
    process.env.TURSO_AUTH_TOKEN = FAKE_TOKEN;
  });

  afterEach(() => {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    vi.resetModules();
  });

  it("injects a store with get and set into ctx.data", async () => {
    const { withTursoServerless } = await import("../src/index.js");

    let capturedData: SnapContext["data"] | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedData = ctx.data;
      return minimalResponse;
    };

    const wrapped = withTursoServerless(snapFn);
    await wrapped(makeCtx());

    expect(capturedData).toBeDefined();
    expect(typeof capturedData!.get).toBe("function");
    expect(typeof capturedData!.set).toBe("function");
  });

  it("does not use the default throwing stub", async () => {
    const { withTursoServerless } = await import("../src/index.js");

    let capturedData: SnapContext["data"] | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedData = ctx.data;
      return minimalResponse;
    };

    const wrapped = withTursoServerless(snapFn);
    await wrapped(makeCtx());

    const stub = createDefaultDataStore();
    expect(capturedData!.get).not.toBe(stub.get);
  });
});
