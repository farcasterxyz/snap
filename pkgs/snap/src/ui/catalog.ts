import { defineCatalog } from "@json-render/core";
import { z } from "zod/v4";
import { snapJsonRenderSchema } from "./schema.js";
import { textProps } from "./text.js";
import { imageProps } from "./image.js";
import { dividerProps } from "./divider.js";
import { spacerProps } from "./spacer.js";
import { progressProps } from "./progress.js";
import { listProps } from "./list.js";
import { gridProps } from "./grid.js";
import { textInputProps } from "./text-input.js";
import { sliderProps } from "./slider.js";
import { buttonGroupProps } from "./button-group.js";
import { toggleProps } from "./toggle.js";
import { barChartProps } from "./bar-chart.js";
import { groupProps } from "./group.js";
import { stackProps } from "./stack.js";
import { buttonProps } from "./button.js";

const snapPostParams = z.object({
  buttonIndex: z.number().int().nonnegative(),
  target: z.string(),
  label: z.string().optional(),
  style: z.enum(["primary", "secondary"]).optional(),
});

const snapTargetParams = z.object({
  target: z.string(),
});

/**
 * Basic catalog: one json-render component per snap element type, plus ActionButton for snap buttons.
 * Does not validate cross-field rules (media count, height budget); snap JSON still goes through `@farcaster/snap` validation.
 */
export const snapJsonRenderCatalog = defineCatalog(snapJsonRenderSchema, {
  components: {
    Text: {
      props: textProps,
      description:
        "Snap text block — style: title | body | caption | label; optional align.",
    },
    Image: {
      props: imageProps,
      description: "HTTPS image with fixed aspect ratio.",
    },
    Divider: {
      props: dividerProps,
      description: "Horizontal rule between blocks.",
    },
    Spacer: {
      props: spacerProps,
      description: "Vertical whitespace — size small | medium | large.",
    },
    Progress: {
      props: progressProps,
      description:
        "Horizontal progress bar (value/max, optional label and color).",
    },
    List: {
      props: listProps,
      description:
        "Ordered / unordered / plain list; max 4 items per snap spec.",
    },
    Grid: {
      props: gridProps,
      description:
        "Rows×cols cell grid; optional interactive empty cells for games.",
    },
    TextInput: {
      props: textInputProps,
      description: "Single-line input; `name` becomes POST inputs key.",
    },
    Slider: {
      props: sliderProps,
      description: "Numeric slider; `name` becomes POST inputs key.",
    },
    ButtonGroup: {
      props: buttonGroupProps,
      description:
        "Exclusive choice; `name` and selected option go into POST inputs.",
    },
    Toggle: {
      props: toggleProps,
      description: "Boolean toggle; `name` becomes POST inputs key.",
    },
    BarChart: {
      props: barChartProps,
      description:
        "Vertical bar chart for labeled values — poll results, rankings, breakdowns.",
    },
    Group: {
      props: groupProps,
      description:
        "Horizontal row layout; use `children` element ids only (no nested JSON objects).",
    },
    Stack: {
      props: stackProps,
      description:
        "Vertical stack for snap page body; maps from snap `page.elements` (`type: stack`). Children are element ids in order top to bottom.",
    },
    ActionButton: {
      props: buttonProps,
      description:
        "Snap action button: post (next page), link (browser), mini_app, sdk — target is HTTPS URL or SDK id.",
    },
  },
  actions: {
    snap_post: {
      description:
        "POST to snap `target` with signed body (fid, inputs, button_index, timestamp, signature); response is next snap page JSON.",
      params: snapPostParams,
    },
    snap_link: {
      description: "Open `target` in the system browser; no server round-trip.",
      params: snapTargetParams,
    },
    snap_mini_app: {
      description: "Open `target` as an in-app Farcaster mini app.",
      params: snapTargetParams,
    },
    snap_sdk: {
      description:
        "Run a Farcaster client SDK action (cast:view, user:follow, …).",
      params: snapTargetParams,
    },
  },
});
