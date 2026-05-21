import { describe, expect, it, vi } from "vitest";
import {
  getSnapExpansionState,
  SNAP_MAX_HEIGHT,
} from "../src/react-native/expand-state";

describe("React Native SnapCard expansion state", () => {
  it("keeps default Show more / Show less behavior internal", () => {
    const collapsed = getSnapExpansionState({
      contentHeight: SNAP_MAX_HEIGHT + 40,
      internalExpanded: false,
    });
    expect(collapsed.clipped).toBe(true);
    expect(collapsed.showButton).toBe(true);
    expect(collapsed.useInternalToggle).toBe(true);
    expect(collapsed.buttonLabel).toBe("Show more");
    expect(collapsed.maxHeight).toBe(SNAP_MAX_HEIGHT);

    const expanded = getSnapExpansionState({
      contentHeight: SNAP_MAX_HEIGHT + 40,
      internalExpanded: true,
    });
    expect(expanded.clipped).toBe(false);
    expect(expanded.showButton).toBe(true);
    expect(expanded.useInternalToggle).toBe(true);
    expect(expanded.buttonLabel).toBe("Show less");
    expect(expanded.maxHeight).toBeUndefined();
  });

  it("uses a custom collapsed expand button label", () => {
    const state = getSnapExpansionState({
      contentHeight: SNAP_MAX_HEIGHT + 40,
      internalExpanded: false,
      expandButtonLabel: "Show Full Snap",
    });

    expect(state.buttonLabel).toBe("Show Full Snap");
  });

  it("marks onExpandPress mode as host-controlled without expanding internally", () => {
    const onExpandPress = vi.fn();
    const state = getSnapExpansionState({
      contentHeight: SNAP_MAX_HEIGHT + 40,
      internalExpanded: false,
      onExpandPress,
    });

    expect(state.clipped).toBe(true);
    expect(state.showButton).toBe(true);
    expect(state.useInternalToggle).toBe(false);
  });

  it("forceExpanded hides controls and removes clipping", () => {
    const state = getSnapExpansionState({
      contentHeight: SNAP_MAX_HEIGHT + 40,
      internalExpanded: false,
      forceExpanded: true,
      expandButtonLabel: "Show Full Snap",
      onExpandPress: vi.fn(),
    });

    expect(state.clipped).toBe(false);
    expect(state.showButton).toBe(false);
    expect(state.maxHeight).toBeUndefined();
    expect(state.showOverflowWarning).toBe(false);
  });
});
