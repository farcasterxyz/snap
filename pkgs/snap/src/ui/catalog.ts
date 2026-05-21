import { defineCatalog } from "@json-render/core";
import { z } from "zod";
import { snapJsonRenderSchema } from "./schema.js";
import { badgeProps } from "./badge.js";
import { buttonProps } from "./button.js";
import { switchProps } from "./switch.js";
import { toggleGroupProps } from "./toggle-group.js";
import { iconProps } from "./icon.js";
import { inputProps } from "./input.js";
import { itemProps } from "./item.js";
import { itemGroupProps } from "./item-group.js";
import { imageProps } from "./image.js";
import { paginatorProps } from "./paginator.js";
import { progressProps } from "./progress.js";
import { separatorProps } from "./separator.js";
import { sliderProps } from "./slider.js";
import { stackProps } from "./stack.js";
import { textProps } from "./text.js";
import { barChartProps } from "./bar-chart.js";
import { cellGridProps } from "./cell-grid.js";

const snapClientParams = z.object({
  client_action: z.record(z.string(), z.unknown()),
});

/**
 * json-render catalog for snap elements.
 *
 * Component keys match the snap wire-format `type` strings.
 * Action names are used directly in `on.press` bindings.
 */
export const snapJsonRenderCatalog = defineCatalog(snapJsonRenderSchema, {
  components: {
    badge: {
      props: badgeProps,
      description:
        "Inline label — variant: default (filled) or outline (bordered). Optional color and icon.",
    },
    button: {
      props: buttonProps,
      description:
        "Action button — use with on.press to bind snap or client actions.",
    },
    switch: {
      props: switchProps,
      description:
        "Boolean toggle; `name` becomes POST inputs key. Optional label.",
    },
    toggle_group: {
      props: toggleGroupProps,
      description:
        "Single or multi-select choice group; `name` becomes POST inputs key. The @farcaster/snap React/React Native components choose row/column orientation from option label length, ignoring snap-sent orientation hints.",
    },
    input: {
      props: inputProps,
      description:
        "Text input; `name` becomes POST inputs key. Optional label and placeholder.",
    },
    item: {
      props: itemProps,
      description:
        "Content row matching shadcn Item: optional media renders on the left, title and optional description render in the content area, and children render in the actions slot (right side). The item itself is not interactive, so avoid navigation-style icons (`chevron-right`, `arrow-right`, `external-link`) that imply the row navigates.",
    },
    item_group: {
      props: itemGroupProps,
      description:
        "Groups item children into a styled list. Optional border around the group and separator lines between items.",
    },
    icon: {
      props: iconProps,
      description:
        "Inline icon from the curated set. Optional color (palette) and size (sm | md).",
    },
    image: {
      props: imageProps,
      description:
        "HTTPS image with fixed aspect ratio. Supports compact 4:1 banners and optional title/subtitle overlay text.",
    },
    paginator: {
      props: paginatorProps,
      description:
        "Client-side paginator. Children are page element ids; the @farcaster/snap React/React Native components render one page at a time with optional built-in previous/next controls and indicators, optional top/bottom controlsPosition, and a local slide/fade transition. Buttons or cell_grid cells in the same snap can bind paginator_next, paginator_previous, or paginator_go_to for custom local navigation. Only one paginator is supported per rendered snap in this release. Page index is local renderer state and is not posted as input.",
    },
    progress: {
      props: progressProps,
      description:
        "Horizontal progress bar (value/max, optional label and color).",
    },
    separator: {
      props: separatorProps,
      description:
        "Visual divider — orientation: horizontal (default) | vertical.",
    },
    slider: {
      props: sliderProps,
      description:
        "Numeric slider; `name` becomes POST inputs key. Optional label.",
    },
    stack: {
      props: stackProps,
      description:
        "Layout container — direction: vertical (default) | horizontal. Children are element ids in order. Horizontal stacks use a single flex row so peers stay side-by-side and shrink with min-width 0. Nested stacks participate as flexible row peers. For all-button stacks, the @farcaster/snap React/React Native components choose row/column orientation from button label length, ignoring snap-sent direction hints; horizontal button rows use content-proportional widths while filling the container unless `equalWidth: true` is provided to force equal-width cells. Vertical button rows default to a tighter gap when `gap` is omitted.",
    },
    text: {
      props: textProps,
      description:
        "Text block — size: md (body, default), sm (caption). Optional weight, align, and maxLines. In v2 renderers, text defaults to one visible line unless maxLines is set.",
    },
    bar_chart: {
      props: barChartProps,
      description:
        "Horizontal bar chart — 1–6 bars with label, value, and optional per-bar color. Optional max and default color.",
    },
    cell_grid: {
      props: cellGridProps,
      description:
        "Cell grid — sparse colored cells on a rows×cols grid. Set maxWidth to sm or md to render compact square boards centered instead of stretching full-width; lg is the default full-width behavior. Cell color and textColor are palette names or literal #rrggbb hex values (hex ignores page accent); textColor overrides the default auto-contrast text color. Two interaction modes: leave select 'off' and bind on.press to fire an action per cell press (inputs[name] is the pressed 'row,col' before the action runs); or set select 'single'/'multiple' for press-to-select with a visual ring (no auto-fire — pair with a separate submit button). on.press is ignored when select is on.",
    },
  },
  actions: {
    submit: {
      description:
        "POST to snap server with signed body (fid, inputs, timestamp, signature); response is next snap page.",
      params: z.object({ target: z.string() }),
    },
    open_url: {
      description: "Open external URL in browser.",
      params: z.object({ target: z.string() }),
    },
    open_snap: {
      description:
        "Open a snap URL inline. The client renders the target as a snap rather than opening a browser.",
      params: z.object({ target: z.string() }),
    },
    open_mini_app: {
      description: "Open target URL as a Farcaster mini app.",
      params: z.object({ target: z.string() }),
    },
    view_cast: {
      description: "Navigate to a cast by hash.",
      params: z.object({ hash: z.string() }),
    },
    view_profile: {
      description: "Navigate to a user profile by FID.",
      params: z.object({ fid: z.number() }),
    },
    compose_cast: {
      description: "Open the cast composer with optional pre-filled content.",
      params: z.object({
        text: z.string().optional(),
        channelKey: z.string().optional(),
        embeds: z.array(z.string()).optional(),
      }),
    },
    view_token: {
      description: "View a token in the wallet. Token is a CAIP-19 identifier.",
      params: z.object({ token: z.string() }),
    },
    send_token: {
      description: "Open send flow for a token. Token is CAIP-19.",
      params: z.object({
        token: z.string(),
        amount: z.string().optional(),
        recipientFid: z.number().optional(),
        recipientAddress: z.string().optional(),
      }),
    },
    swap_token: {
      description: "Open swap flow between two tokens. Tokens are CAIP-19.",
      params: z.object({
        sellToken: z.string().optional(),
        buyToken: z.string().optional(),
      }),
    },
    paginator_next: {
      description:
        "Move the snap's paginator to the next page locally. Does not POST and is ignored when no paginator is rendered.",
      params: z.object({ page: z.number().int().min(0).optional() }),
    },
    paginator_previous: {
      description:
        "Move the snap's paginator to the previous page locally. Does not POST and is ignored when no paginator is rendered.",
      params: z.object({ page: z.number().int().min(0).optional() }),
    },
    paginator_prev: {
      description:
        "Alias for paginator_previous. Move the snap's paginator to the previous page locally.",
      params: z.object({ page: z.number().int().min(0).optional() }),
    },
    paginator_go_to: {
      description:
        "Move the snap's paginator to a specific zero-based page index locally. Does not POST and is ignored when no paginator is rendered.",
      params: z.object({ page: z.number().int().min(0) }),
    },
  },
});
