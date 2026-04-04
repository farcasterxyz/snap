import { describe, it, expect } from "vitest";
import {
  createDefaultDataStore,
  createInMemoryDataStore,
} from "../src/dataStore";

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

describe("createInMemoryDataStore", () => {
  it("get returns null for missing key", async () => {
    const store = createInMemoryDataStore();
    expect(await store.get("missing")).toBeNull();
  });

  it("set and get round-trip JSON-serializable values", async () => {
    const store = createInMemoryDataStore();
    await store.set("n", 42);
    await store.set("s", "hello");
    await store.set("obj", { a: [1, true, null] });
    expect(await store.get("n")).toBe(42);
    expect(await store.get("s")).toBe("hello");
    expect(await store.get("obj")).toEqual({ a: [1, true, null] });
  });

  it("set overwrites existing key", async () => {
    const store = createInMemoryDataStore();
    await store.set("k", "first");
    await store.set("k", "second");
    expect(await store.get("k")).toBe("second");
  });
});
