import { describe, expect, it } from "vitest";
import { snapJsonRenderCatalog } from "../src/ui/index.js";

describe("snapJsonRenderCatalog (@farcaster/snap/ui)", () => {
  it("exports expected component names", () => {
    expect([...snapJsonRenderCatalog.componentNames].sort()).toEqual(
      [
        "badge",
        "bar_chart",
        "button",
        "icon",
        "image",
        "input",
        "item",
        "item_group",
        "cell_grid",
        "paginator",
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
        "send_transaction",
        "send_token",
        "open_url",
        "open_snap",
        "open_mini_app",
        "paginator_go_to",
        "paginator_next",
        "paginator_prev",
        "submit",
        "swap_token",
        "view_cast",
        "view_channel",
        "view_profile",
        "view_token",
      ].sort(),
    );
  });

  it("accepts bindable action activity state on transaction buttons", () => {
    const result = snapJsonRenderCatalog.validate({
      root: "root",
      state: {
        actions: {
          mint: {
            pending: false,
          },
        },
      },
      elements: {
        root: {
          type: "button",
          props: {
            label: "Mint",
            variant: "primary",
            disabled: { $bindState: "/actions/mint/pending" },
          },
          on: {
            press: {
              action: "send_transaction",
              params: {
                activityKey: "mint",
                chainId: "8453",
                to: "0x0000000000000000000000000000000000000001",
                data: "0x",
                value: "0x0",
              },
            },
          },
        },
      },
    });

    expect(result.success).toBe(true);
  });
});
