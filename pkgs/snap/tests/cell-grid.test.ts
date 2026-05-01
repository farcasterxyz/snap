import { describe, expect, it } from "vitest";
import { cellGridProps } from "../src/ui/cell-grid.js";

const baseGrid = {
  cols: 2,
  rows: 2,
  cells: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ],
};

describe("cell_grid cell schema", () => {
  it("accepts cells without a value (back-compat)", () => {
    expect(cellGridProps.safeParse(baseGrid).success).toBe(true);
  });

  it("accepts cells with a value string", () => {
    const grid = {
      ...baseGrid,
      cells: [
        { row: 0, col: 0, value: "Mon", content: "M" },
        { row: 0, col: 1, value: "Tue", content: "T" },
        { row: 1, col: 0, value: "Wed", content: "W" },
        { row: 1, col: 1, value: "Thu", content: "T" },
      ],
    };
    expect(cellGridProps.safeParse(grid).success).toBe(true);
  });

  it("rejects empty value", () => {
    const grid = {
      ...baseGrid,
      cells: [{ row: 0, col: 0, value: "" }],
    };
    expect(cellGridProps.safeParse(grid).success).toBe(false);
  });

  it("rejects value over 30 chars", () => {
    const grid = {
      ...baseGrid,
      cells: [{ row: 0, col: 0, value: "x".repeat(31) }],
    };
    expect(cellGridProps.safeParse(grid).success).toBe(false);
  });

  it("rejects non-string value", () => {
    const grid = {
      ...baseGrid,
      cells: [{ row: 0, col: 0, value: 5 }],
    };
    expect(cellGridProps.safeParse(grid).success).toBe(false);
  });
});
