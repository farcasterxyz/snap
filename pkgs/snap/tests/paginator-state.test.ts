import { describe, expect, it } from "vitest";
import {
  getPaginatorAction,
  runPaginatorAction,
  SNAP_PAGINATOR_PAGE_COUNT_PATH,
  SNAP_PAGINATOR_PAGE_PATH,
} from "../src/ui/paginator-state";

function createStore(initial: Record<string, unknown>) {
  const state = { ...initial };
  return {
    state,
    get: (path: string) => state[path],
    set: (path: string, value: unknown) => {
      state[path] = value;
    },
  };
}

describe("paginator json-render local state", () => {
  it("parses paginator actions from press bindings", () => {
    expect(getPaginatorAction({ press: { action: "paginator_next" } })).toEqual({
      action: "paginator_next",
    });
    expect(
      getPaginatorAction({
        press: { action: "paginator_go_to", params: { page: 2 } },
      }),
    ).toEqual({ action: "paginator_go_to", page: 2 });
    expect(getPaginatorAction({ press: { action: "submit" } })).toBeNull();
  });

  it("moves page state without touching inputs", () => {
    const store = createStore({
      [SNAP_PAGINATOR_PAGE_PATH]: 0,
      [SNAP_PAGINATOR_PAGE_COUNT_PATH]: 3,
      "/inputs/choice": "keep",
    });

    expect(runPaginatorAction(store, { action: "paginator_next" })).toBe(true);
    expect(store.state[SNAP_PAGINATOR_PAGE_PATH]).toBe(1);
    expect(store.state["/inputs/choice"]).toBe("keep");
  });

  it("clamps paginator movement to the known page count", () => {
    const store = createStore({
      [SNAP_PAGINATOR_PAGE_PATH]: 2,
      [SNAP_PAGINATOR_PAGE_COUNT_PATH]: 3,
    });

    expect(runPaginatorAction(store, { action: "paginator_next" })).toBe(true);
    expect(store.state[SNAP_PAGINATOR_PAGE_PATH]).toBe(2);

    expect(
      runPaginatorAction(store, { action: "paginator_go_to", page: -4 }),
    ).toBe(true);
    expect(store.state[SNAP_PAGINATOR_PAGE_PATH]).toBe(0);
  });

  it("ignores paginator actions before a paginator has registered page count", () => {
    const store = createStore({});

    expect(runPaginatorAction(store, { action: "paginator_next" })).toBe(false);
    expect(store.state[SNAP_PAGINATOR_PAGE_PATH]).toBeUndefined();
  });
});
