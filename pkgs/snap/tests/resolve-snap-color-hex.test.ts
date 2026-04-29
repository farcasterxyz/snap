import { describe, it, expect } from "vitest";
import {
  isSnapHexColorString,
  resolveSnapColorHex,
  PALETTE_LIGHT_HEX,
} from "../src/colors";
import { cellGridProps } from "../src/ui/cell-grid";

describe("cellGridProps color field", () => {
  const base = { cols: 2, rows: 2, cells: [{ row: 0, col: 0 }] };

  it("accepts palette name or #rrggbb", () => {
    expect(cellGridProps.safeParse({ ...base, cells: [{ row: 0, col: 0, color: "red" }] }).success).toBe(
      true,
    );
    expect(
      cellGridProps.safeParse({ ...base, cells: [{ row: 0, col: 0, color: "#ff00aa" }] }).success,
    ).toBe(true);
  });

  it("rejects invalid color strings", () => {
    expect(
      cellGridProps.safeParse({ ...base, cells: [{ row: 0, col: 0, color: "not-a-color" }] }).success,
    ).toBe(false);
  });
});

describe("isSnapHexColorString", () => {
  it("accepts strict #rrggbb", () => {
    expect(isSnapHexColorString("#aabbcc")).toBe(true);
    expect(isSnapHexColorString("#AABBCC")).toBe(true);
    expect(isSnapHexColorString("  #ff00aa  ")).toBe(true);
  });
  it("rejects non-6-digit hex and shorthand", () => {
    expect(isSnapHexColorString("#abc")).toBe(false);
    expect(isSnapHexColorString("#aabbccd")).toBe(false);
    expect(isSnapHexColorString("blue")).toBe(false);
    expect(isSnapHexColorString("")).toBe(false);
  });
});

describe("resolveSnapColorHex", () => {
  const accent = "#ff0000";

  it("returns accent for missing or accent token", () => {
    expect(resolveSnapColorHex(undefined, { accentHex: accent, appearance: "light" })).toBe(
      accent,
    );
    expect(resolveSnapColorHex("accent", { accentHex: accent, appearance: "light" })).toBe(
      accent,
    );
  });

  it("returns literal hex unchanged", () => {
    expect(
      resolveSnapColorHex("#112233", { accentHex: accent, appearance: "light" }),
    ).toBe("#112233");
  });

  it("maps palette names by appearance", () => {
    expect(
      resolveSnapColorHex("purple", { accentHex: accent, appearance: "light" }),
    ).toBe(PALETTE_LIGHT_HEX.purple);
  });

  it("falls back to accent for unknown strings", () => {
    expect(
      resolveSnapColorHex("not-a-color", { accentHex: accent, appearance: "light" }),
    ).toBe(accent);
  });
});
