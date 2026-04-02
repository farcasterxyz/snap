import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  createDefaultDataStore,
  DEFAULT_THEME_ACCENT,
  type SnapContext,
  type SnapFunction,
} from "@farcaster/snap";

// We test withUpstash by controlling the environment variables directly.
// @upstash/redis and @upstash/lock are not mocked; we just test the branching
// logic based on env var presence.

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

  it("throws on withLock()", async () => {
    const store = createDefaultDataStore();
    await expect(store.withLock(async () => "x")).rejects.toThrow(
      "not configured",
    );
  });
});

describe("withUpstash — no env vars", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("returns the original snapFn and passes ctx through unchanged", async () => {
    const { withUpstash } = await import("../src/index.js");

    let capturedCtx: SnapContext | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedCtx = ctx;
      return minimalResponse;
    };

    const wrapped = withUpstash(snapFn);
    expect(wrapped).toBe(snapFn);

    const ctx = makeCtx();
    await wrapped(ctx);

    expect(capturedCtx).toBe(ctx);
  });
});

describe("withUpstash — with env vars", () => {
  const FAKE_URL = "https://fake.upstash.io";
  const FAKE_TOKEN = "fake-token";

  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.UPSTASH_REDIS_REST_URL = FAKE_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = FAKE_TOKEN;
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    vi.resetModules();
  });

  it("injects a store with get, set, and withLock into ctx.data", async () => {
    const { withUpstash } = await import("../src/index.js");

    let capturedData: SnapContext["data"] | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedData = ctx.data;
      return minimalResponse;
    };

    const wrapped = withUpstash(snapFn);
    await wrapped(makeCtx());

    expect(capturedData).toBeDefined();
    expect(typeof capturedData!.get).toBe("function");
    expect(typeof capturedData!.set).toBe("function");
    expect(typeof capturedData!.withLock).toBe("function");
  });

  it("does not use the default throwing stub", async () => {
    const { withUpstash } = await import("../src/index.js");

    let capturedData: SnapContext["data"] | undefined;
    const snapFn: SnapFunction = async (ctx) => {
      capturedData = ctx.data;
      return minimalResponse;
    };

    const wrapped = withUpstash(snapFn);
    await wrapped(makeCtx());

    // The real store's get() would call Redis (failing with a network error),
    // not the "not configured" error from the default stub.
    // We just verify the function reference is different from the default stub.
    const stub = createDefaultDataStore();
    expect(capturedData!.get).not.toBe(stub.get);
  });
});
