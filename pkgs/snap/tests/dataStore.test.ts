import { describe, it, expect } from "vitest";
import { createInMemoryDataStore } from "../src/dataStore";

/** Yield to the macrotask queue so other `withLock` waiters could run if the lock were broken. */
function yieldMacrotask(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe("createInMemoryDataStore", () => {
  it("serializes concurrent withLock callbacks (no lost increments)", async () => {
    const store = createInMemoryDataStore();
    const n = 100;
    await Promise.all(
      Array.from({ length: n }, () =>
        store.withLock(async (s) => {
          const raw = await s.get("count");
          const v = typeof raw === "number" ? raw : 0;
          await yieldMacrotask();
          await s.set("count", v + 1);
        }),
      ),
    );
    expect(await store.get("count")).toBe(n);
  });

  it("never runs two withLock bodies at the same time", async () => {
    const store = createInMemoryDataStore();
    let depth = 0;
    let maxDepth = 0;
    const n = 40;
    await Promise.all(
      Array.from({ length: n }, () =>
        store.withLock(async () => {
          depth += 1;
          maxDepth = Math.max(maxDepth, depth);
          await yieldMacrotask();
          await yieldMacrotask();
          depth -= 1;
        }),
      ),
    );
    expect(maxDepth).toBe(1);
    expect(depth).toBe(0);
  });

  it("completes each withLock body before starting the next (ordered critical sections)", async () => {
    const store = createInMemoryDataStore();
    const events: string[] = [];
    let seq = 0;
    const k = 25;
    await Promise.all(
      Array.from({ length: k }, () =>
        store.withLock(async () => {
          const id = ++seq;
          events.push(`enter-${id}`);
          await yieldMacrotask();
          events.push(`exit-${id}`);
        }),
      ),
    );
    for (let i = 1; i <= k; i += 1) {
      expect(events).toContain(`enter-${i}`);
      expect(events).toContain(`exit-${i}`);
    }
    const enterIdx = (id: number) => events.indexOf(`enter-${id}`);
    const exitIdx = (id: number) => events.indexOf(`exit-${id}`);
    for (let i = 1; i <= k; i += 1) {
      expect(exitIdx(i)).toBeGreaterThan(enterIdx(i));
    }
    for (let i = 2; i <= k; i += 1) {
      expect(enterIdx(i)).toBeGreaterThan(exitIdx(i - 1));
    }
  });

  it("continues the lock chain after a rejected withLock", async () => {
    const store = createInMemoryDataStore();
    await expect(
      store.withLock(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await store.withLock(async (s) => {
      await s.set("after", "ok");
    });
    expect(await store.get("after")).toBe("ok");
  });

  it("rejected withLock does not break later concurrent waiters", async () => {
    const store = createInMemoryDataStore();
    const failing = store.withLock(async () => {
      await yieldMacrotask();
      throw new Error("fail");
    });
    const after = store.withLock(async (s) => {
      await s.set("recovered", 1);
    });
    await expect(failing).rejects.toThrow("fail");
    await after;
    expect(await store.get("recovered")).toBe(1);
  });
});
