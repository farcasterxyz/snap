import { describe, expect, it } from "vitest";
import { snapJsonRenderCatalog } from "../src/ui/index.js";

/** Same module graph as the `@farcaster/snap/ui` export; catches missing ui barrel wiring. */
describe("snapJsonRenderCatalog (@farcaster/snap/ui)", () => {
  it("exports validate and expected component names", () => {
    expect(typeof snapJsonRenderCatalog.validate).toBe("function");
    expect([...snapJsonRenderCatalog.componentNames].sort()).toEqual(
      [
        "ActionButton",
        "BarChart",
        "ButtonGroup",
        "Divider",
        "Grid",
        "Group",
        "Image",
        "List",
        "Progress",
        "Slider",
        "Spacer",
        "Stack",
        "Text",
        "TextInput",
        "Toggle",
      ].sort(),
    );
  });

  it("exports expected snap action names", () => {
    expect([...snapJsonRenderCatalog.actionNames].sort()).toEqual(
      ["snap_link", "snap_mini_app", "snap_post", "snap_sdk"].sort(),
    );
  });
});
