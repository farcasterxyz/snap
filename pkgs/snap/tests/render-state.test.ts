import { describe, expect, it } from "vitest";
import {
  applyStatePaths,
  buildActionActivityStateChanges,
  buildInitialRenderState,
  cloneSnapRenderState,
  getUnpresentedSnapEffects,
  hasPendingSnapAction,
  markSnapEffectsPresented,
  type SnapRenderState,
} from "../src/render-state";

describe("snap render state", () => {
  it("captures inputs, controls, cell selections, and paginator state", () => {
    const state: SnapRenderState = {
      inputs: {
        name: "alice",
      },
      theme: {
        accent: "purple",
      },
    };

    applyStatePaths(state, [
      { path: "/inputs/name", value: "bob" },
      { path: "/inputs/enabled", value: true },
      { path: "/inputs/volume", value: 42 },
      { path: "/inputs/genre", value: "jazz" },
      { path: "/inputs/cells", value: "0,1|1,0" },
      { path: "/ui/paginator/page", value: 2 },
      { path: "/ui/paginator/pageCount", value: 4 },
    ]);

    expect(state).toEqual({
      inputs: {
        name: "bob",
        enabled: true,
        volume: 42,
        genre: "jazz",
        cells: "0,1|1,0",
      },
      theme: {
        accent: "purple",
      },
      ui: {
        paginator: {
          page: 2,
          pageCount: 4,
        },
      },
    });
  });

  it("supports record changes and single top-level paths", () => {
    const state: SnapRenderState = {};

    applyStatePaths(state, {
      "/inputs/choice": "pop",
      "/ui/paginator/page": 1,
      loading: false,
    });

    expect(state).toEqual({
      inputs: {
        choice: "pop",
      },
      ui: {
        paginator: {
          page: 1,
        },
      },
      loading: false,
    });
  });

  it("builds action activity state changes from action names and explicit keys", () => {
    expect(
      buildActionActivityStateChanges({
        actionName: "send_transaction",
        params: {},
        pending: true,
      }),
    ).toEqual([
      { path: "/actions/send_transaction/name", value: "send_transaction" },
      { path: "/actions/send_transaction/pending", value: true },
    ]);

    expect(
      buildActionActivityStateChanges({
        actionName: "send_transaction",
        params: { activityKey: "mint token/primary" },
        pending: false,
      }),
    ).toEqual([
      { path: "/actions/mint_token_primary/name", value: "send_transaction" },
      { path: "/actions/mint_token_primary/pending", value: false },
    ]);
  });

  it("detects whether any snap action is pending", () => {
    expect(hasPendingSnapAction({})).toBe(false);
    expect(
      hasPendingSnapAction({
        actions: {
          mint: {
            pending: false,
          },
          swap: {
            pending: true,
          },
        },
      }),
    ).toBe(true);
  });

  it("restores saved state over authored state and keeps page theme current", () => {
    const restored = buildInitialRenderState({
      specState: {
        inputs: {
          choice: "rock",
          volume: 4,
        },
        theme: {
          accent: "blue",
          surface: "soft",
        },
        ui: {
          paginator: {
            page: 0,
            pageCount: 2,
          },
        },
      },
      initialRenderState: {
        inputs: {
          choice: "jazz",
        },
        theme: {
          accent: "red",
        },
        ui: {
          paginator: {
            page: 1,
          },
        },
      },
      themeAccent: "green",
    });

    expect(restored).toEqual({
      inputs: {
        choice: "jazz",
        volume: 4,
      },
      theme: {
        accent: "green",
        surface: "soft",
      },
      ui: {
        paginator: {
          page: 1,
          pageCount: 2,
        },
      },
    });
  });

  it("clones state before exposing or seeding it", () => {
    const original: SnapRenderState = {
      inputs: {
        selected: ["a"],
      },
      ui: {
        paginator: {
          page: 1,
        },
      },
    };

    const cloned = cloneSnapRenderState(original);
    (cloned.inputs as { selected: string[] }).selected.push("b");
    (cloned.ui as { paginator: { page: number } }).paginator.page = 2;

    expect(original).toEqual({
      inputs: {
        selected: ["a"],
      },
      ui: {
        paginator: {
          page: 1,
        },
      },
    });
  });

  it("starts fresh when no initial render state is provided for a new page", () => {
    const fresh = buildInitialRenderState({
      specState: {
        inputs: {
          choice: "classical",
        },
        ui: {
          paginator: {
            page: 0,
          },
        },
      },
    });

    expect(fresh).toEqual({
      inputs: {
        choice: "classical",
      },
      theme: {},
      ui: {
        paginator: {
          page: 0,
        },
      },
    });
  });

  it("tracks presented effects so remounts do not replay them", () => {
    const state: SnapRenderState = {};

    expect(getUnpresentedSnapEffects(state, ["confetti", "fireworks"])).toEqual(
      ["confetti", "fireworks"],
    );

    expect(markSnapEffectsPresented(state, ["confetti"])).toBe(true);
    expect(getUnpresentedSnapEffects(state, ["confetti", "fireworks"])).toEqual(
      ["fireworks"],
    );

    expect(markSnapEffectsPresented(state, ["confetti"])).toBe(false);
    expect(getUnpresentedSnapEffects(state, ["confetti"])).toEqual([]);
  });

  it("restores presented effects but makes a fresh page eligible again", () => {
    const previousState: SnapRenderState = {};
    markSnapEffectsPresented(previousState, ["confetti"]);

    const restored = buildInitialRenderState({
      specState: {},
      initialRenderState: previousState,
    });

    expect(
      getUnpresentedSnapEffects(restored, ["confetti", "fireworks"]),
    ).toEqual(["fireworks"]);

    const fresh = buildInitialRenderState({
      specState: {},
    });

    expect(getUnpresentedSnapEffects(fresh, ["confetti"])).toEqual([
      "confetti",
    ]);
  });
});
