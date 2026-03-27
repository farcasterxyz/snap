import { defineCatalog } from "@json-render/core";
import { z } from "zod";
import { snapJsonRenderSchema } from "./schema.js";
import { snapComponentProps } from "./props.js";

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
      props: snapComponentProps.Text,
      description:
        "Snap text block — style: title | body | caption | label; optional align.",
    },
    Image: {
      props: snapComponentProps.Image,
      description: "HTTPS image with fixed aspect ratio.",
    },
    Video: {
      props: snapComponentProps.Video,
      description: "HTTPS video (mp4/webm).",
    },
    Divider: {
      props: snapComponentProps.Divider,
      description: "Horizontal rule between blocks.",
    },
    Spacer: {
      props: snapComponentProps.Spacer,
      description: "Vertical whitespace — size small | medium | large.",
    },
    Progress: {
      props: snapComponentProps.Progress,
      description:
        "Horizontal progress bar (value/max, optional label and color).",
    },
    List: {
      props: snapComponentProps.List,
      description:
        "Ordered / unordered / plain list; max 4 items per snap spec.",
    },
    Grid: {
      props: snapComponentProps.Grid,
      description:
        "Rows×cols cell grid; optional interactive empty cells for games.",
    },
    TextInput: {
      props: snapComponentProps.TextInput,
      description: "Single-line input; `name` becomes POST inputs key.",
    },
    Slider: {
      props: snapComponentProps.Slider,
      description: "Numeric slider; `name` becomes POST inputs key.",
    },
    ButtonGroup: {
      props: snapComponentProps.ButtonGroup,
      description:
        "Exclusive choice; `name` and selected option go into POST inputs.",
    },
    Toggle: {
      props: snapComponentProps.Toggle,
      description: "Boolean toggle; `name` becomes POST inputs key.",
    },
    BarChart: {
      props: snapComponentProps.BarChart,
      description:
        "Vertical bar chart for labeled values — poll results, rankings, breakdowns.",
    },
    Group: {
      props: snapComponentProps.Group,
      description:
        "Horizontal row layout; use `children` element ids only (no nested JSON objects).",
    },
    Stack: {
      props: snapComponentProps.Stack,
      description:
        "Vertical stack for snap page body; maps from snap `page.elements` (`type: stack`). Children are element ids in order top to bottom.",
    },
    ActionButton: {
      props: snapComponentProps.ActionButton,
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
