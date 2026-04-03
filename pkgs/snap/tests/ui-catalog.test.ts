import { describe, expect, it } from "vitest";
import { snapJsonRenderCatalog } from "../src/ui/index.js";

describe("snapJsonRenderCatalog (@farcaster/snap/ui)", () => {
  it("exports expected component names", () => {
    expect([...snapJsonRenderCatalog.componentNames].sort()).toEqual(
      [
        "badge",
        "button",
        "icon",
        "image",
        "input",
        "item",
        "item_group",
        "progress",
        "separator",
        "slider",
        "stack",
        "switch",
        "text",
        "toggle_group",
      ].sort(),
    );
  });

  it("exports expected snap action names", () => {
    expect([...snapJsonRenderCatalog.actionNames].sort()).toEqual(
      [
        "compose_cast",
        "send_token",
        "open_url",
        "open_mini_app",
        "submit",
        "swap_token",
        "view_cast",
        "view_profile",
        "view_token",
      ].sort(),
    );
  });
});
