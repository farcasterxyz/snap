import { describe, expect, it } from "vitest";
import { defaultHorizontalGapSize } from "../src/stack-horizontal-utils.js";

describe("defaultHorizontalGapSize", () => {
  it("falls back to md when column count is unknown", () => {
    expect(defaultHorizontalGapSize(undefined)).toBe("md");
  });

  it("uses lg for 2 columns", () => {
    expect(defaultHorizontalGapSize(2)).toBe("lg");
  });

  it("uses md for 3 columns", () => {
    expect(defaultHorizontalGapSize(3)).toBe("md");
  });

  it("uses sm for 4+ columns", () => {
    expect(defaultHorizontalGapSize(4)).toBe("sm");
    expect(defaultHorizontalGapSize(5)).toBe("sm");
    expect(defaultHorizontalGapSize(6)).toBe("sm");
  });

  it("uses lg for 1 column (treated as the loosest end of the scale)", () => {
    expect(defaultHorizontalGapSize(1)).toBe("lg");
  });
});
