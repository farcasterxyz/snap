import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

/** Snap structural limits (match {@link @farcaster/snap/constants}) */
const MAX_CHILDREN = 6;

type View =
  | "welcome"
  | "typography"
  | "badges"
  | "images"
  | "images_row"
  | "images_tall"
  | "icons"
  | "items"
  | "items_actions"
  | "items_groups"
  | "items_groups_border"
  | "layout"
  | "layout_leaderboard"
  | "layout_metrics"
  | "data_bar_chart"
  | "data_cell_grid"
  | "data"
  | "form"
  | "form_toggles"
  | "results"
  | "actions"
  | "actions_social"
  | "actions_tokens";

/**
 * Catalog tour: primitives → media → layout & lists → inputs → charts/metrics → grid → actions.
 * Progress sits with bar chart; cell_grid is a separate interaction primitive.
 */
const CATALOG_STEPS: View[] = [
  "typography",
  "badges",
  "icons",
  "images",
  "images_row",
  "images_tall",
  "layout",
  "items",
  "items_groups",
  "items_groups_border",
  "form",
  "form_toggles",
  "data_bar_chart",
  "layout_metrics",
  "data_cell_grid",
  "actions",
  "actions_social",
  "actions_tokens",
];

const FLOW: View[] = ["welcome", ...CATALOG_STEPS];

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const view = (url.searchParams.get("view") ?? "welcome") as View;
  const base = snapBaseUrl(ctx.request);

  const inputs = ctx.action.type === "post" ? ctx.action.inputs : {};
  if (view === "results" && ctx.action.type === "post") {
    return resultsPage(base, ctx.action.inputs);
  }

  switch (view) {
    case "typography":
      return typographyPage(base);
    case "badges":
      return badgesPage(base);
    case "images":
      return imagesPage(base);
    case "images_row":
      return imagesRowPage(base);
    case "images_tall":
      return imagesTallPage(base);
    case "icons":
      return iconsPage(base);
    case "items":
    case "items_actions":
      return itemsPage(base);
    case "items_groups":
      return itemsGroupsPage(base);
    case "items_groups_border":
      return itemsGroupsBorderPage(base);
    case "layout":
      return layoutPage(base);
    case "layout_leaderboard":
      return itemsGroupsPage(base);
    case "layout_metrics":
      return layoutMetricsPage(base);
    case "data_bar_chart":
    case "data":
      return dataBarChartPage(base);
    case "data_cell_grid":
      return dataCellGridPage(base, inputs);
    case "form":
      return formPage(base);
    case "form_toggles":
      return formTogglesPage(base);
    case "actions":
      return actionsPage(base);
    case "actions_social":
      return actionsSocialPage(base);
    case "actions_tokens":
      return actionsTokensPage(base);
    default:
      return welcomePage(base);
  }
});

export default app;

function assertMaxChildren(id: string, children: string[]): void {
  if (children.length > MAX_CHILDREN) {
    throw new Error(`snap-catalog: "${id}" has ${children.length} children (max ${MAX_CHILDREN})`);
  }
}

// ─── Navigation ─────────────────────────────────────────

function nav(base: string, current: View): Record<string, object> {
  const idx = FLOW.indexOf(current);
  const prev = idx > 0 ? FLOW[idx - 1] : null;
  const next = idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  const children: string[] = [];
  const elements: Record<string, object> = {};

  if (prev) {
    children.push("nav-prev");
    elements["nav-prev"] = {
      type: "button",
      props: { label: "Back", icon: "arrow-left" },
      on: { press: { action: "submit", params: { target: `${base}/?view=${prev}` } } },
    };
  }

  if (next) {
    children.push("nav-next");
    elements["nav-next"] = {
      type: "button",
      props: { label: "Next", icon: "arrow-right" },
      on: { press: { action: "submit", params: { target: `${base}/?view=${next}` } } },
    };
  }

  assertMaxChildren("nav", children);

  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal", justify: "between" },
      children,
    },
    ...elements,
  };
}

/** Progress within catalog steps only (badge shows index / total). */
function catalogStep(current: View): string {
  const idx = CATALOG_STEPS.indexOf(current);
  if (idx === -1) return "";
  return `${idx + 1} / ${CATALOG_STEPS.length}`;
}

// ─── Pages ──────────────────────────────────────────────

/** Hub: jump to any catalog section (root ≤7, nested ≤6). */
function welcomePage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["intro", "browse", "stats", "sep", "start"],
        },
        intro: {
          type: "stack",
          props: {},
          children: ["heading"],
        },
        heading: {
          type: "text",
          props: { content: "Snap UI catalog", size: "md", align: "center" },
        },
        browse: {
          type: "stack",
          props: { gap: "sm" },
          children: [
            "browse-r1",
            "browse-r2",
            "browse-r3",
            "browse-r4",
            "browse-r5",
            "browse-r6",
          ],
        },
        "browse-r1": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-typography", "browse-badges"],
        },
        "browse-typography": {
          type: "button",
          props: { label: "Typography", icon: "star" },
          on: { press: { action: "submit", params: { target: `${base}/?view=typography` } } },
        },
        "browse-badges": {
          type: "button",
          props: { label: "Badges", icon: "bookmark" },
          on: { press: { action: "submit", params: { target: `${base}/?view=badges` } } },
        },
        "browse-r2": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-icons", "browse-images"],
        },
        "browse-icons": {
          type: "button",
          props: { label: "Icons", icon: "zap" },
          on: { press: { action: "submit", params: { target: `${base}/?view=icons` } } },
        },
        "browse-images": {
          type: "button",
          props: { label: "Images", icon: "image" },
          on: { press: { action: "submit", params: { target: `${base}/?view=images` } } },
        },
        "browse-r3": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-layout", "browse-items-groups"],
        },
        "browse-layout": {
          type: "button",
          props: { label: "Layout", icon: "bookmark" },
          on: { press: { action: "submit", params: { target: `${base}/?view=layout` } } },
        },
        "browse-items-groups": {
          type: "button",
          props: { label: "Items & groups", icon: "users" },
          on: { press: { action: "submit", params: { target: `${base}/?view=items` } } },
        },
        "browse-r4": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-form", "browse-data"],
        },
        "browse-form": {
          type: "button",
          props: { label: "Form", icon: "check" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "browse-data": {
          type: "button",
          props: { label: "Data", icon: "trending-down" },
          on: { press: { action: "submit", params: { target: `${base}/?view=data_bar_chart` } } },
        },
        "browse-r5": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-progress", "browse-cell-grid"],
        },
        "browse-progress": {
          type: "button",
          props: { label: "Progress", icon: "trending-up" },
          on: { press: { action: "submit", params: { target: `${base}/?view=layout_metrics` } } },
        },
        "browse-cell-grid": {
          type: "button",
          props: { label: "Cell grid", icon: "repeat" },
          on: { press: { action: "submit", params: { target: `${base}/?view=data_cell_grid` } } },
        },
        "browse-r6": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["browse-actions"],
        },
        "browse-actions": {
          type: "button",
          props: { label: "Actions", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=actions` } } },
        },
        stats: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["s1", "s2", "s3"],
        },
        s1: { type: "badge", props: { label: "16 components", icon: "zap" } },
        s2: { type: "badge", props: { label: "11 actions", color: "blue", icon: "trending-up" } },
        s3: { type: "badge", props: { label: "Spec v2", color: "green", icon: "check" } },
        sep: { type: "separator", props: {} },
        start: {
          type: "button",
          props: { label: "Start tour: Text first", variant: "primary", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=typography` } } },
        },
      },
    },
  };
}

function typographyPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "content", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Typography \u00b7 ${catalogStep("typography")}` } },
        content: {
          type: "stack",
          props: { gap: "sm" },
          children: ["t-md", "t-sm", "sep", "weight-row", "t-center", "t-right"],
        },
        "t-md": {
          type: "text",
          props: {
            content: "Medium — default body.",
          },
        },
        "t-sm": { type: "text", props: { content: "Small — captions & meta", size: "sm" } },
        sep: { type: "separator", props: {} },
        "weight-row": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["t-bold", "t-normal"],
        },
        "t-bold": { type: "text", props: { content: "Bold", weight: "bold" } },
        "t-normal": { type: "text", props: { content: "Normal", weight: "normal" } },
        "t-center": { type: "text", props: { content: "Center", align: "center" } },
        "t-right": { type: "text", props: { content: "Right", align: "right" } },
        ...nav(base, "typography"),
      },
    },
  };
}

function badgesPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "badges-body", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Badges \u00b7 ${catalogStep("badges")}` } },
        "badges-body": {
          type: "stack",
          props: {},
          children: ["label-filled", "filled-block", "sep-mid", "label-outline", "outline-block"],
        },
        "label-filled": {
          type: "text",
          props: { content: "Filled (default)", size: "sm", weight: "bold" },
        },
        "filled-block": {
          type: "stack",
          props: {},
          children: ["badge-filled-row1", "badge-filled-row2"],
        },
        "badge-filled-row1": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bd1", "bd2", "bd3", "bd4", "bd5"],
        },
        bd1: { type: "badge", props: { label: "Accent" } },
        bd2: { type: "badge", props: { label: "Gray", color: "gray" } },
        bd3: { type: "badge", props: { label: "Blue", color: "blue" } },
        bd4: { type: "badge", props: { label: "Red", color: "red" } },
        bd5: { type: "badge", props: { label: "Amber", color: "amber" } },
        "badge-filled-row2": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bd6", "bd7", "bd8", "bd9"],
        },
        bd6: { type: "badge", props: { label: "Green", color: "green" } },
        bd7: { type: "badge", props: { label: "Teal", color: "teal" } },
        bd8: { type: "badge", props: { label: "Purple", color: "purple" } },
        bd9: { type: "badge", props: { label: "Pink", color: "pink" } },
        "sep-mid": { type: "separator", props: {} },
        "label-outline": {
          type: "text",
          props: { content: "Outline", size: "sm", weight: "bold" },
        },
        "outline-block": {
          type: "stack",
          props: {},
          children: ["badge-outline-row1", "badge-outline-row2"],
        },
        "badge-outline-row1": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bo1", "bo2", "bo3", "bo4", "bo5"],
        },
        bo1: { type: "badge", props: { label: "Accent", variant: "outline" } },
        bo2: { type: "badge", props: { label: "Gray", color: "gray", variant: "outline" } },
        bo3: { type: "badge", props: { label: "Blue", color: "blue", variant: "outline" } },
        bo4: { type: "badge", props: { label: "Red", color: "red", variant: "outline" } },
        bo5: { type: "badge", props: { label: "Amber", color: "amber", variant: "outline" } },
        "badge-outline-row2": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bo6", "bo7", "bo8", "bo9"],
        },
        bo6: { type: "badge", props: { label: "Green", color: "green", variant: "outline" } },
        bo7: { type: "badge", props: { label: "Teal", color: "teal", variant: "outline" } },
        bo8: { type: "badge", props: { label: "Purple", color: "purple", variant: "outline" } },
        bo9: { type: "badge", props: { label: "Pink", color: "pink", variant: "outline" } },
        ...nav(base, "badges"),
      },
    },
  };
}

function imagesPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "block-aspects", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Images \u00b7 ${catalogStep("images")}` } },
        "block-aspects": {
          type: "stack",
          props: {},
          children: ["row-image-copy"],
        },
        "row-image-copy": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["img-peer", "peer-column"],
        },
        "img-peer": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&auto=format",
            aspect: "1:1",
            alt: "Earth",
          },
        },
        "peer-column": {
          type: "stack",
          props: { gap: "sm" },
          children: ["peer-title", "peer-body", "peer-badge"],
        },
        "peer-title": {
          type: "text",
          props: { content: "Caption & meta", size: "sm", weight: "bold" },
        },
        "peer-body": {
          type: "text",
          props: {
            content:
              "Use a nested vertical stack for copy beside an image. Row peers share width; keep text in a column so it wraps.",
            size: "sm",
          },
        },
        "peer-badge": { type: "badge", props: { label: "1:1 + column", color: "teal" } },
        ...nav(base, "images"),
      },
    },
  };
}

function imagesRowPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "block-row3", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Images \u00b7 ${catalogStep("images_row")}` } },
        "block-row3": {
          type: "stack",
          props: {},
          children: ["row-three"],
        },
        "row-three": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["img-h1", "img-h2", "img-h3"],
        },
        "img-h1": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&auto=format",
            aspect: "1:1",
            alt: "Mountain landscape",
          },
        },
        "img-h2": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop&auto=format",
            aspect: "1:1",
            alt: "Foggy hills",
          },
        },
        "img-h3": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop&auto=format",
            aspect: "1:1",
            alt: "Forest sunrise",
          },
        },
        ...nav(base, "images_row"),
      },
    },
  };
}

function imagesTallPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "block-tall", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Images \u00b7 ${catalogStep("images_tall")}` } },
        "block-tall": {
          type: "stack",
          props: {},
          children: ["row-tall"],
        },
        "row-tall": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["img-916", "tall-column"],
        },
        "img-916": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=360&h=640&fit=crop&auto=format",
            aspect: "9:16",
            alt: "Portrait frame",
          },
        },
        "tall-column": {
          type: "stack",
          props: { gap: "sm" },
          children: ["tall-title", "tall-body", "tall-badge"],
        },
        "tall-title": {
          type: "text",
          props: { content: "9:16 portrait", size: "sm", weight: "bold" },
        },
        "tall-body": {
          type: "text",
          props: {
            content:
              "Same aspect ratio prop as other images; sharing the row keeps height manageable on small cards.",
            size: "sm",
          },
        },
        "tall-badge": { type: "badge", props: { label: "9:16", color: "teal" } },
        ...nav(base, "images_tall"),
      },
    },
  };
}

function iconsPage(base: string): SnapHandlerResult {
  /**
   * Full ICON_NAMES under MAX_ELEMENTS (64): three two-column rows (Nav|Status,
   * Content|Media & commerce, Actions|Feedback), then Social full-width (6 icons).
   */
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "pr-ns", "pr-cm", "pr-af", "pr-social", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Icons \u00b7 ${catalogStep("icons")}` } },
        "pr-ns": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["col-nav", "col-status"],
        },
        "col-nav": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lnav", "rnav"],
        },
        lnav: { type: "text", props: { content: "Navigation", size: "sm", weight: "bold" } },
        rnav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-arrow-right", "i-arrow-left", "i-external-link", "i-chevron-right"],
        },
        "i-arrow-right": { type: "icon", props: { name: "arrow-right" } },
        "i-arrow-left": { type: "icon", props: { name: "arrow-left" } },
        "i-external-link": { type: "icon", props: { name: "external-link" } },
        "i-chevron-right": { type: "icon", props: { name: "chevron-right" } },
        "col-status": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lst", "rst"],
        },
        lst: { type: "text", props: { content: "Status", size: "sm", weight: "bold" } },
        rst: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-check", "i-x", "i-alert", "i-info", "i-clock"],
        },
        "i-check": { type: "icon", props: { name: "check", color: "green" } },
        "i-x": { type: "icon", props: { name: "x", color: "red" } },
        "i-alert": { type: "icon", props: { name: "alert-triangle", color: "amber" } },
        "i-info": { type: "icon", props: { name: "info", color: "blue" } },
        "i-clock": { type: "icon", props: { name: "clock", color: "gray" } },
        "pr-cm": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["col-content", "col-mc"],
        },
        "col-content": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lco", "rco"],
        },
        lco: { type: "text", props: { content: "Content", size: "sm", weight: "bold" } },
        rco: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-star", "i-trophy", "i-zap", "i-flame", "i-gift"],
        },
        "i-star": { type: "icon", props: { name: "star", color: "amber" } },
        "i-trophy": { type: "icon", props: { name: "trophy", color: "amber" } },
        "i-zap": { type: "icon", props: { name: "zap", color: "amber" } },
        "i-flame": { type: "icon", props: { name: "flame", color: "red" } },
        "i-gift": { type: "icon", props: { name: "gift", color: "pink" } },
        "col-mc": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lmc", "rmc"],
        },
        lmc: {
          type: "text",
          props: { content: "Media & commerce", size: "sm", weight: "bold" },
        },
        rmc: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-image", "i-play", "i-pause", "i-wallet", "i-coins"],
        },
        "i-image": { type: "icon", props: { name: "image" } },
        "i-play": { type: "icon", props: { name: "play", color: "green" } },
        "i-pause": { type: "icon", props: { name: "pause", color: "gray" } },
        "i-wallet": { type: "icon", props: { name: "wallet" } },
        "i-coins": { type: "icon", props: { name: "coins", color: "amber" } },
        "pr-af": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["col-actions", "col-feedback"],
        },
        "col-actions": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lac", "rac"],
        },
        lac: { type: "text", props: { content: "Actions", size: "sm", weight: "bold" } },
        rac: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-plus", "i-minus", "i-refresh", "i-bookmark"],
        },
        "i-plus": { type: "icon", props: { name: "plus" } },
        "i-minus": { type: "icon", props: { name: "minus" } },
        "i-refresh": { type: "icon", props: { name: "refresh-cw" } },
        "i-bookmark": { type: "icon", props: { name: "bookmark", color: "blue" } },
        "col-feedback": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lfb", "rfb"],
        },
        lfb: { type: "text", props: { content: "Feedback / data", size: "sm", weight: "bold" } },
        rfb: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-thumbs-up", "i-thumbs-down", "i-trending-up", "i-trending-down"],
        },
        "i-thumbs-up": { type: "icon", props: { name: "thumbs-up", color: "green" } },
        "i-thumbs-down": { type: "icon", props: { name: "thumbs-down", color: "red" } },
        "i-trending-up": { type: "icon", props: { name: "trending-up", color: "green" } },
        "i-trending-down": { type: "icon", props: { name: "trending-down", color: "red" } },
        "pr-social": {
          type: "stack",
          props: {},
          children: ["col-social"],
        },
        "col-social": {
          type: "stack",
          props: { gap: "sm" },
          children: ["lso", "rso"],
        },
        lso: { type: "text", props: { content: "Social", size: "sm", weight: "bold" } },
        rso: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["i-heart", "i-msg", "i-repeat", "i-share", "i-user", "i-users"],
        },
        "i-heart": { type: "icon", props: { name: "heart", color: "red" } },
        "i-msg": { type: "icon", props: { name: "message-circle", color: "blue" } },
        "i-repeat": { type: "icon", props: { name: "repeat", color: "green" } },
        "i-share": { type: "icon", props: { name: "share" } },
        "i-user": { type: "icon", props: { name: "user", color: "accent" } },
        "i-users": { type: "icon", props: { name: "users", color: "purple" } },
        ...nav(base, "icons"),
      },
    },
  };
}

function itemsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "sec-items-a", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Items \u00b7 ${catalogStep("items")}` } },
        "sec-items-a": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: [
            "it-title-only",
            "it-with-desc",
            "it-badge",
            "it-icon",
            "it-button",
            "it-variant-default",
          ],
        },
        "it-title-only": { type: "item", props: { title: "Title only" } },
        "it-with-desc": {
          type: "item",
          props: {
            title: "Title + description",
            description: "Optional subtitle; omit description for a single-line row.",
          },
        },
        "it-badge": {
          type: "item",
          props: { title: "Trending Cast", description: "842 likes in the last hour" },
          children: ["it-badge-v"],
        },
        "it-badge-v": { type: "badge", props: { label: "Hot", color: "red", icon: "flame" } },
        "it-icon": {
          type: "item",
          props: { title: "Weekly Digest", description: "Your personalized summary" },
          children: ["it-icon-v"],
        },
        "it-icon-v": { type: "icon", props: { name: "star", color: "amber", size: "md" } },
        "it-button": {
          type: "item",
          props: { title: "Share this Snap", description: "Pre-fill the composer" },
          children: ["it-button-v"],
        },
        "it-button-v": {
          type: "button",
          props: { label: "Share", icon: "share" },
          on: {
            press: {
              action: "compose_cast",
              params: {
                text: "Check out Snaps!",
                embeds: ["https://snap-catalog.example.com"],
              },
            },
          },
        },
        "it-variant-default": {
          type: "item",
          props: {
            title: "Variant",
            description: "Optional; only default exists today.",
            variant: "default",
          },
        },
        ...nav(base, "items"),
      },
    },
  };
}

function itemsGroupsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "sec-a", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: {
          type: "badge",
          props: { label: `Item group \u00b7 ${catalogStep("items_groups")}` },
        },
        "sec-a": {
          type: "stack",
          props: { gap: "sm" },
          children: ["label-plain", "group-plain", "label-ranked", "leaderboard"],
        },
        "label-plain": {
          type: "text",
          props: { content: "Plain rows", size: "sm", weight: "bold" },
        },
        "group-plain": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["gs1", "gs2", "gs3"],
        },
        gs1: { type: "item", props: { title: "Notifications" } },
        gs2: { type: "item", props: { title: "Privacy" } },
        gs3: { type: "item", props: { title: "Account" } },
        "label-ranked": {
          type: "text",
          props: { content: "Ranked rows", size: "sm", weight: "bold" },
        },
        leaderboard: {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["lb1", "lb2", "lb3"],
        },
        lb1: { type: "item", props: { title: "dwr.eth", description: "2,847 pts" }, children: ["lb1-r"] },
        "lb1-r": { type: "badge", props: { label: "#1", color: "amber", icon: "trophy" } },
        lb2: { type: "item", props: { title: "v.eth", description: "2,103 pts" }, children: ["lb2-r"] },
        "lb2-r": { type: "badge", props: { label: "#2", color: "gray" } },
        lb3: { type: "item", props: { title: "horsefacts.eth", description: "1,892 pts" }, children: ["lb3-r"] },
        "lb3-r": { type: "badge", props: { label: "#3", color: "gray" } },
        ...nav(base, "items_groups"),
      },
    },
  };
}

function itemsGroupsBorderPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "body", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: {
          type: "badge",
          props: { label: `Item group \u00b7 ${catalogStep("items_groups_border")}` },
        },
        body: {
          type: "stack",
          props: { gap: "sm" },
          children: ["label-border", "group-border"],
        },
        "label-border": {
          type: "text",
          props: { content: "Border", size: "sm", weight: "bold" },
        },
        "group-border": {
          type: "item_group",
          props: { border: true, separator: true, gap: "sm" },
          children: ["bd1", "bd2", "bd3"],
        },
        bd1: {
          type: "item",
          props: { title: "Season opener", description: "Tickets remain" },
          children: ["bd1-b"],
        },
        "bd1-b": { type: "badge", props: { label: "Soon", color: "amber" } },
        bd2: {
          type: "item",
          props: { title: "Weekly recap", description: "Roundup drops Sunday" },
          children: ["bd2-b"],
        },
        "bd2-b": { type: "badge", props: { label: "New", color: "blue" } },
        bd3: {
          type: "item",
          props: { title: "Community grants", description: "Applications close Friday" },
          children: ["bd3-b"],
        },
        "bd3-b": { type: "badge", props: { label: "Open", color: "green" } },
        ...nav(base, "items_groups_border"),
      },
    },
  };
}

function layoutPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "top", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Layout \u00b7 ${catalogStep("layout")}` } },
        top: {
          type: "stack",
          props: {},
          children: ["label-h", "row", "sep-h", "label-v", "vert-stack"],
        },
        "label-h": {
          type: "text",
          props: { content: "Horizontal stack", size: "sm", weight: "bold" },
        },
        row: {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["card-l", "card-r"],
        },
        "card-l": {
          type: "item",
          props: { title: "Protocol", description: "12 proposals" },
          children: ["card-l-icon"],
        },
        "card-l-icon": { type: "icon", props: { name: "trending-up", color: "green" } },
        "card-r": {
          type: "item",
          props: { title: "Governance", description: "3 active votes" },
          children: ["card-r-icon"],
        },
        "card-r-icon": { type: "icon", props: { name: "users", color: "blue" } },
        "sep-h": { type: "separator", props: {} },
        "label-v": {
          type: "text",
          props: { content: "Vertical stack", size: "sm", weight: "bold" },
        },
        "vert-stack": {
          type: "stack",
          props: { gap: "sm" },
          children: ["v-a", "v-b", "v-c"],
        },
        "v-a": {
          type: "item",
          props: { title: "Notifications", description: "Push and email" },
          children: ["v-a-act"],
        },
        "v-a-act": { type: "badge", props: { label: "3", color: "red", icon: "zap" } },
        "v-b": {
          type: "item",
          props: { title: "Privacy", description: "Profile and casts" },
          children: ["v-b-act"],
        },
        "v-b-act": { type: "icon", props: { name: "star", color: "purple", size: "md" } },
        "v-c": {
          type: "item",
          props: { title: "Account", description: "Wallet and apps" },
          children: ["v-c-act"],
        },
        "v-c-act": {
          type: "button",
          props: { label: "Open", variant: "primary", icon: "wallet" },
        },
        ...nav(base, "layout"),
      },
    },
  };
}

function layoutMetricsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "metrics-col", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: {
          type: "badge",
          props: { label: `Progress \u00b7 ${catalogStep("layout_metrics")}` },
        },
        "metrics-col": {
          type: "stack",
          props: { gap: "md" },
          children: ["m1", "m2", "m3"],
        },
        m1: { type: "progress", props: { value: 89, max: 100, label: "Uptime" } },
        m2: { type: "progress", props: { value: 67, max: 100, label: "Adoption" } },
        m3: { type: "progress", props: { value: 34, max: 100, label: "Rollout" } },
        ...nav(base, "layout_metrics"),
      },
    },
  };
}

function dataBarChartPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "chart", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: {
          type: "badge",
          props: { label: `Bar chart \u00b7 ${catalogStep("data_bar_chart")}` },
        },
        chart: {
          type: "bar_chart",
          props: {
            bars: [
              { label: "Poblano", value: 42 },
              { label: "Negro", value: 38, color: "red" },
              { label: "Verde", value: 15, color: "green" },
              { label: "Rojo", value: 12, color: "amber" },
            ],
          },
        },
        ...nav(base, "data_bar_chart"),
      },
    },
  };
}

function dataCellGridPage(base: string, inputs: Record<string, unknown>): SnapHandlerResult {
  const colorGrid = typeof inputs.color_grid === "string" ? inputs.color_grid : "";
  const pressedLabel = colorGrid
    ? `Last press: row ${colorGrid.split(",")[0]}, col ${colorGrid.split(",")[1]}`
    : "Press a cell to submit";
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      state: { inputs: { color_grid: colorGrid } },
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "grid-section", "multi-section", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: {
          type: "badge",
          props: { label: `Cell grid \u00b7 ${catalogStep("data_cell_grid")}` },
        },
        "grid-section": {
          type: "stack",
          props: {},
          children: ["grid", "grid-pressed"],
        },
        grid: {
          type: "cell_grid",
          props: {
            name: "color_grid",
            cols: 4,
            rows: 4,
            cells: [
              { row: 0, col: 0, color: "red" },
              { row: 0, col: 1, color: "amber" },
              { row: 0, col: 2, color: "green" },
              { row: 0, col: 3, color: "blue" },
              { row: 1, col: 0, color: "purple" },
              { row: 1, col: 3, color: "pink" },
              { row: 2, col: 1, color: "teal", content: "X" },
              { row: 2, col: 2, color: "gray" },
              { row: 3, col: 0, color: "blue" },
              { row: 3, col: 3, color: "red" },
            ],
          },
          on: {
            press: { action: "submit", params: { target: `${base}/?view=data_cell_grid` } },
          },
        },
        "grid-pressed": {
          type: "text",
          props: { content: pressedLabel, size: "sm" },
        },
        "multi-section": {
          type: "stack",
          props: {},
          children: ["sep2", "multi-label", "multi-grid"],
        },
        sep2: { type: "separator", props: {} },
        "multi-label": {
          type: "text",
          props: { content: "Multiselect (select: multiple)", size: "sm" },
        },
        "multi-grid": {
          type: "cell_grid",
          props: {
            name: "multi_grid",
            cols: 3,
            rows: 3,
            select: "multiple",
            cells: [
              { row: 0, col: 0, color: "blue" },
              { row: 0, col: 1, color: "blue" },
              { row: 0, col: 2, color: "blue" },
              { row: 1, col: 0, color: "green" },
              { row: 1, col: 1, color: "green" },
              { row: 1, col: 2, color: "green" },
              { row: 2, col: 0, color: "amber" },
              { row: 2, col: 1, color: "amber" },
              { row: 2, col: 2, color: "amber" },
            ],
          },
        },
        ...nav(base, "data_cell_grid"),
      },
    },
  };
}

function formPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["form-intro", "form-fields", "form-switches", "nav"],
        },
        "form-intro": {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Form \u00b7 ${catalogStep("form")}` } },
        "form-fields": {
          type: "stack",
          props: {},
          children: ["name-input", "tip-input", "frequency"],
        },
        "name-input": {
          type: "input",
          props: { name: "displayName", label: "Display Name", placeholder: "Enter your name" },
        },
        "tip-input": {
          type: "input",
          props: { name: "tipAmount", type: "number", label: "Default Tip (USDC)", placeholder: "1.00" },
        },
        frequency: {
          type: "slider",
          props: { name: "frequency", label: "Content Frequency", min: 1, max: 10, defaultValue: 5 },
        },
        "form-switches": {
          type: "stack",
          props: {},
          children: ["collab", "discovery"],
        },
        collab: { type: "switch", props: { name: "collaborations", label: "Open to collaborations" } },
        discovery: { type: "switch", props: { name: "discovery", label: "Show in discovery", defaultChecked: true } },
        ...nav(base, "form"),
      },
    },
  };
}

function formTogglesPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["form-intro", "form-toggles", "submit", "nav"],
        },
        "form-intro": {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Toggle Group / Buttons \u00b7 ${catalogStep("form_toggles")}` } },
        "form-toggles": {
          type: "stack",
          props: {},
          children: ["interest", "skills"],
        },
        interest: {
          type: "toggle_group",
          props: { name: "interest", label: "Primary Interest", options: ["Protocol", "Apps", "Culture"] },
        },
        skills: {
          type: "toggle_group",
          props: {
            name: "skills",
            label: "Skills (select multiple)",
            multiple: true,
            orientation: "vertical",
            options: ["Solidity", "TypeScript", "Design", "Product"],
          },
        },
        submit: {
          type: "button",
          props: { label: "Save Profile", variant: "primary", icon: "check" },
          on: { press: { action: "submit", params: { target: `${base}/?view=results` } } },
        },
        ...nav(base, "form_toggles"),
      },
    },
  };
}

function resultsPage(base: string, inputs: Record<string, unknown>): SnapHandlerResult {
  const displayName = String(inputs.displayName || "Anonymous");
  const tipAmount = String(inputs.tipAmount || "0");
  const frequency = String(inputs.frequency ?? "5");
  const collaborations = inputs.collaborations ? "Yes" : "No";
  const discovery = inputs.discovery ? "Yes" : "No";
  const interest = String(inputs.interest || "Not set");
  const skills = Array.isArray(inputs.skills) ? inputs.skills.join(", ") : String(inputs.skills || "None");
  const interestSkillsLabel = `${interest} · ${skills}`;

  return {
    version: "2.0",
    theme: { accent: "green" },
    effects: ["confetti"],
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "results-items", "sep2", "btns"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["heading", "subtitle"],
        },
        heading: { type: "text", props: { content: "Profile saved!", size: "md", align: "center" } },
        subtitle: {
          type: "text",
          props: { content: `Welcome, ${displayName}!`, size: "sm", align: "center" },
        },
        "results-items": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["r1", "r2", "r3", "r4", "r5", "r6"],
        },
        r1: { type: "item", props: { title: "Name" }, children: ["r1v"] },
        r1v: { type: "badge", props: { label: displayName, icon: "user" } },
        r2: { type: "item", props: { title: "Tip" }, children: ["r2v"] },
        r2v: { type: "badge", props: { label: `$${tipAmount}`, color: "green", icon: "coins" } },
        r3: { type: "item", props: { title: "Frequency" }, children: ["r3v"] },
        r3v: { type: "badge", props: { label: `${frequency}/10`, color: "blue" } },
        r4: { type: "item", props: { title: "Collaborations" }, children: ["r4v"] },
        r4v: {
          type: "badge",
          props: {
            label: collaborations,
            color: collaborations === "Yes" ? "green" : "gray",
            icon: collaborations === "Yes" ? "check" : "x",
          },
        },
        r5: { type: "item", props: { title: "Discovery" }, children: ["r5v"] },
        r5v: {
          type: "badge",
          props: {
            label: discovery,
            color: discovery === "Yes" ? "green" : "gray",
            icon: discovery === "Yes" ? "check" : "x",
          },
        },
        r6: { type: "item", props: { title: "Interest & skills" }, children: ["r6v"] },
        r6v: { type: "badge", props: { label: interestSkillsLabel, color: "amber", icon: "star" } },
        sep2: { type: "separator", props: {} },
        btns: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-edit", "btn-next"],
        },
        "btn-edit": {
          type: "button",
          props: { label: "Edit", icon: "arrow-left" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "btn-next": {
          type: "button",
          props: { label: "Continue", variant: "primary", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=actions` } } },
        },
      },
    },
  };
}

function actionsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "pink" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "body-nav", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Actions \u00b7 ${catalogStep("actions")}` } },
        "body-nav": {
          type: "stack",
          props: {},
          children: ["nav-label", "nav-actions"],
        },
        "nav-label": { type: "text", props: { content: "Navigation", weight: "bold" } },
        "nav-actions": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["a-url", "a-miniapp"],
        },
        "a-url": {
          type: "item",
          props: { title: "Open Farcaster", description: "Opens in system browser" },
          children: ["a-url-btn"],
        },
        "a-url-btn": {
          type: "button",
          props: { label: "Open", icon: "external-link" },
          on: { press: { action: "open_url", params: { target: "https://farcaster.xyz" } } },
        },
        "a-miniapp": {
          type: "item",
          props: { title: "Launch Mini App", description: "In-app experience" },
          children: ["a-miniapp-btn"],
        },
        "a-miniapp-btn": {
          type: "button",
          props: { label: "Launch", icon: "arrow-right" },
          on: { press: { action: "open_mini_app", params: { target: "https://farcaster.xyz" } } },
        },
        ...nav(base, "actions"),
      },
    },
  };
}

function actionsSocialPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "pink" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "body-social", "nav"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Actions \u00b7 ${catalogStep("actions_social")}` } },
        "body-social": {
          type: "stack",
          props: {},
          children: ["social-label", "social-actions"],
        },
        "social-label": { type: "text", props: { content: "Social", weight: "bold" } },
        "social-actions": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["a-profile", "a-cast", "a-compose"],
        },
        "a-profile": {
          type: "item",
          props: { title: "View Profile", description: "Navigate to @dwr" },
          children: ["a-profile-btn"],
        },
        "a-profile-btn": {
          type: "button",
          props: { label: "View", icon: "user" },
          on: { press: { action: "view_profile", params: { fid: 3 } } },
        },
        "a-cast": {
          type: "item",
          props: { title: "View Cast", description: "Open a specific cast" },
          children: ["a-cast-btn"],
        },
        "a-cast-btn": {
          type: "button",
          props: { label: "View", icon: "message-circle" },
          on: { press: { action: "view_cast", params: { hash: "0x0000000000000000000000000000000000000001" } } },
        },
        "a-compose": {
          type: "item",
          props: { title: "Share this Snap", description: "Pre-fill the composer" },
          children: ["a-compose-btn"],
        },
        "a-compose-btn": {
          type: "button",
          props: { label: "Share", icon: "share" },
          on: {
            press: {
              action: "compose_cast",
              params: {
                text: "Check out the Snap Component Catalog!",
                embeds: ["https://snap-catalog.example.com"],
              },
            },
          },
        },
        ...nav(base, "actions_social"),
      },
    },
  };
}

function actionsTokensPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "pink" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["hdr", "body-tokens", "nav", "start-over"],
        },
        hdr: {
          type: "stack",
          props: {},
          children: ["step"],
        },
        step: { type: "badge", props: { label: `Actions \u00b7 ${catalogStep("actions_tokens")}` } },
        "body-tokens": {
          type: "stack",
          props: {},
          children: ["token-label", "token-actions"],
        },
        "token-label": { type: "text", props: { content: "Tokens", weight: "bold" } },
        "token-actions": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["a-token", "a-send", "a-swap"],
        },
        "a-token": {
          type: "item",
          props: { title: "View USDC", description: "Open in wallet" },
          children: ["a-token-btn"],
        },
        "a-token-btn": {
          type: "button",
          props: { label: "View", icon: "wallet" },
          on: {
            press: {
              action: "view_token",
              params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
            },
          },
        },
        "a-send": {
          type: "item",
          props: { title: "Send USDC", description: "Pre-filled amount" },
          children: ["a-send-btn"],
        },
        "a-send-btn": {
          type: "button",
          props: { label: "Send", icon: "coins" },
          on: {
            press: {
              action: "send_token",
              params: {
                token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                amount: "10.00",
                recipientFid: 3,
              },
            },
          },
        },
        "a-swap": {
          type: "item",
          props: { title: "Swap ETH \u2192 USDC", description: "Open swap interface" },
          children: ["a-swap-btn"],
        },
        "a-swap-btn": {
          type: "button",
          props: { label: "Swap", icon: "refresh-cw" },
          on: {
            press: {
              action: "swap_token",
              params: {
                sellToken: "eip155:8453/slip44:60",
                buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
              },
            },
          },
        },
        ...nav(base, "actions_tokens"),
        "start-over": {
          type: "button",
          props: { label: "Start Over", variant: "secondary", icon: "refresh-cw" },
          on: { press: { action: "submit", params: { target: `${base}/` } } },
        },
      },
    },
  };
}

// ─── Base URL ───────────────────────────────────────────

function snapBaseUrl(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const host = (forwardedHost ?? hostHeader)?.split(",")[0].trim();
  const isLoopback =
    host !== undefined &&
    /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/.test(host);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim().toLowerCase()
    : isLoopback
      ? "http"
      : "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3020"}`.replace(/\/$/, "");
}
