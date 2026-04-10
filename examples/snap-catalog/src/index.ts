import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View =
  | "welcome"
  | "typography"
  | "images"
  | "icons"
  | "items"
  | "layout"
  | "data"
  | "form"
  | "results"
  | "actions";

const FLOW: View[] = [
  "welcome",
  "typography",
  "images",
  "icons",
  "items",
  "layout",
  "data",
  "form",
  "actions",
];

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const view = (url.searchParams.get("view") ?? "welcome") as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") return dataPage(base);
  if (view === "results" && ctx.action.type === "post") {
    return resultsPage(base, ctx.action.inputs);
  }

  switch (view) {
    case "typography": return typographyPage(base);
    case "images": return imagesPage(base);
    case "icons": return iconsPage(base);
    case "items": return itemsPage(base);
    case "layout": return layoutPage(base);
    case "data": return dataPage(base);
    case "form": return formPage(base);
    case "actions": return actionsPage(base);
    default: return welcomePage(base);
  }
});

export default app;

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

  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal", justify: "between" },
      children,
    },
    ...elements,
  };
}

function step(current: View): string {
  const idx = FLOW.indexOf(current) + 1;
  return `${idx} / ${FLOW.length}`;
}

// ─── Pages ──────────────────────────────────────────────

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
          children: ["heading", "tagline", "hero", "stats", "sep", "start"],
        },
        heading: {
          type: "text",
          props: { content: "Farcaster Snaps", size: "md", align: "center" },
        },
        tagline: {
          type: "text",
          props: { content: "Interactive feed cards. 16 components, 9 actions, one spec.", size: "sm", align: "center" },
        },
        hero: {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop&auto=format",
            aspect: "16:9",
          },
        },
        stats: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["s1", "s2", "s3"],
        },
        s1: { type: "badge", props: { label: "16 Components", icon: "zap" } },
        s2: { type: "badge", props: { label: "9 Actions", color: "blue", icon: "trending-up" } },
        s3: { type: "badge", props: { label: "v1.0", color: "green", icon: "check" } },
        sep: { type: "separator", props: {} },
        start: {
          type: "button",
          props: { label: "Get Started", variant: "primary", icon: "arrow-right" },
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
          children: ["step", "heading", "sep1", "t-md", "t-sm", "sep2", "t-bold", "t-normal", "sep3", "t-center", "t-right", "sep4", "nav"],
        },
        step: { type: "badge", props: { label: `Typography \u00b7 ${step("typography")}` } },
        heading: {
          type: "text",
          props: { content: "Text sizes, weights, and alignment.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "t-md": { type: "text", props: { content: "Medium \u2014 body text and descriptions. This is the default size for most content in a snap." } },
        "t-sm": { type: "text", props: { content: "Small \u2014 captions, metadata, timestamps", size: "sm" } },
        sep2: { type: "separator", props: {} },
        "t-bold": { type: "text", props: { content: "Bold weight", weight: "bold" } },
        "t-normal": { type: "text", props: { content: "Normal weight", weight: "normal" } },
        sep3: { type: "separator", props: {} },
        "t-center": { type: "text", props: { content: "Center aligned", align: "center" } },
        "t-right": { type: "text", props: { content: "Right aligned", align: "right" } },
        sep4: { type: "separator", props: {} },
        ...nav(base, "typography"),
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
          children: ["step", "heading", "sep1", "img-wide", "label-wide", "row-sq-43", "label-sq-43", "sep2", "img-916", "label-916", "sep3", "nav"],
        },
        step: { type: "badge", props: { label: `Images \u00b7 ${step("images")}` } },
        heading: {
          type: "text",
          props: { content: "All four aspect ratios.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "img-wide": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&auto=format",
            aspect: "16:9",
          },
        },
        "label-wide": { type: "text", props: { content: "16:9", size: "sm", align: "center" } },
        "row-sq-43": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["img-sq", "img-43"],
        },
        "img-sq": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&auto=format",
            aspect: "1:1",
          },
        },
        "img-43": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=450&fit=crop&auto=format",
            aspect: "4:3",
          },
        },
        "label-sq-43": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["lbl-sq", "lbl-43"],
        },
        "lbl-sq": { type: "text", props: { content: "1:1", size: "sm", align: "center" } },
        "lbl-43": { type: "text", props: { content: "4:3", size: "sm", align: "center" } },
        sep2: { type: "separator", props: {} },
        "img-916": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=360&h=640&fit=crop&auto=format",
            aspect: "9:16",
          },
        },
        "label-916": { type: "text", props: { content: "9:16", size: "sm", align: "center" } },
        sep3: { type: "separator", props: {} },
        ...nav(base, "images"),
      },
    },
  };
}

function iconsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["step", "heading", "sep0", "label-badges", "badge-row1", "badge-row2", "sep1", "label-nav", "row-nav", "label-status", "row-status", "label-social", "row-social", "label-content", "row-content", "label-media", "row-media", "label-commerce", "row-commerce", "label-actions", "row-actions", "label-feedback", "row-feedback", "sep2", "nav"],
        },
        step: { type: "badge", props: { label: `Icons & Badges \u00b7 ${step("icons")}` } },
        heading: { type: "text", props: { content: "Badges with colors and icons, plus 34 curated Lucide icons.", size: "sm" } },
        sep0: { type: "separator", props: {} },
        "label-badges": { type: "text", props: { content: "Badges", size: "sm", weight: "bold" } },
        "badge-row1": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bd1", "bd2", "bd3"],
        },
        bd1: { type: "badge", props: { label: "Accent" } },
        bd2: { type: "badge", props: { label: "Blue", color: "blue" } },
        bd3: { type: "badge", props: { label: "Red", color: "red" } },
        "badge-row2": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["bd4", "bd5", "bd6"],
        },
        bd4: { type: "badge", props: { label: "Live", color: "green", icon: "zap" } },
        bd5: { type: "badge", props: { label: "Hot", color: "red", icon: "flame" } },
        bd6: { type: "badge", props: { label: "3 New", color: "blue", icon: "info" } },
        sep1: { type: "separator", props: {} },
        "label-nav": { type: "text", props: { content: "Navigation", size: "sm", weight: "bold" } },
        "row-nav": { type: "stack", props: { direction: "horizontal" }, children: ["i-arrow-right", "i-arrow-left", "i-external-link", "i-chevron-right"] },
        "i-arrow-right": { type: "icon", props: { name: "arrow-right" } },
        "i-arrow-left": { type: "icon", props: { name: "arrow-left" } },
        "i-external-link": { type: "icon", props: { name: "external-link" } },
        "i-chevron-right": { type: "icon", props: { name: "chevron-right" } },
        "label-status": { type: "text", props: { content: "Status", size: "sm", weight: "bold" } },
        "row-status": { type: "stack", props: { direction: "horizontal" }, children: ["i-check", "i-x", "i-alert", "i-info", "i-clock"] },
        "i-check": { type: "icon", props: { name: "check", color: "green" } },
        "i-x": { type: "icon", props: { name: "x", color: "red" } },
        "i-alert": { type: "icon", props: { name: "alert-triangle", color: "amber" } },
        "i-info": { type: "icon", props: { name: "info", color: "blue" } },
        "i-clock": { type: "icon", props: { name: "clock", color: "gray" } },
        "label-social": { type: "text", props: { content: "Social", size: "sm", weight: "bold" } },
        "row-social": { type: "stack", props: { direction: "horizontal" }, children: ["i-heart", "i-msg", "i-repeat", "i-share", "i-user", "i-users"] },
        "i-heart": { type: "icon", props: { name: "heart", color: "red" } },
        "i-msg": { type: "icon", props: { name: "message-circle", color: "blue" } },
        "i-repeat": { type: "icon", props: { name: "repeat", color: "green" } },
        "i-share": { type: "icon", props: { name: "share" } },
        "i-user": { type: "icon", props: { name: "user" } },
        "i-users": { type: "icon", props: { name: "users" } },
        "label-content": { type: "text", props: { content: "Content", size: "sm", weight: "bold" } },
        "row-content": { type: "stack", props: { direction: "horizontal" }, children: ["i-star", "i-trophy", "i-zap", "i-flame", "i-gift"] },
        "i-star": { type: "icon", props: { name: "star", color: "amber" } },
        "i-trophy": { type: "icon", props: { name: "trophy", color: "amber" } },
        "i-zap": { type: "icon", props: { name: "zap", color: "purple" } },
        "i-flame": { type: "icon", props: { name: "flame", color: "red" } },
        "i-gift": { type: "icon", props: { name: "gift", color: "pink" } },
        "label-media": { type: "text", props: { content: "Media", size: "sm", weight: "bold" } },
        "row-media": { type: "stack", props: { direction: "horizontal" }, children: ["i-image", "i-play", "i-pause"] },
        "i-image": { type: "icon", props: { name: "image" } },
        "i-play": { type: "icon", props: { name: "play", color: "green" } },
        "i-pause": { type: "icon", props: { name: "pause" } },
        "label-commerce": { type: "text", props: { content: "Commerce", size: "sm", weight: "bold" } },
        "row-commerce": { type: "stack", props: { direction: "horizontal" }, children: ["i-wallet", "i-coins"] },
        "i-wallet": { type: "icon", props: { name: "wallet" } },
        "i-coins": { type: "icon", props: { name: "coins", color: "amber" } },
        "label-actions": { type: "text", props: { content: "Actions", size: "sm", weight: "bold" } },
        "row-actions": { type: "stack", props: { direction: "horizontal" }, children: ["i-plus", "i-minus", "i-refresh", "i-bookmark"] },
        "i-plus": { type: "icon", props: { name: "plus" } },
        "i-minus": { type: "icon", props: { name: "minus" } },
        "i-refresh": { type: "icon", props: { name: "refresh-cw" } },
        "i-bookmark": { type: "icon", props: { name: "bookmark" } },
        "label-feedback": { type: "text", props: { content: "Feedback", size: "sm", weight: "bold" } },
        "row-feedback": { type: "stack", props: { direction: "horizontal" }, children: ["i-thumbs-up", "i-thumbs-down", "i-trending-up", "i-trending-down"] },
        "i-thumbs-up": { type: "icon", props: { name: "thumbs-up", color: "green" } },
        "i-thumbs-down": { type: "icon", props: { name: "thumbs-down", color: "red" } },
        "i-trending-up": { type: "icon", props: { name: "trending-up", color: "green" } },
        "i-trending-down": { type: "icon", props: { name: "trending-down", color: "red" } },
        sep2: { type: "separator", props: {} },
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
          children: [
            "step", "heading",
            "sep1", "label-variants", "v-default",
            "sep2", "label-actions", "a-badge", "a-icon", "a-button",
            "sep3", "label-groups", "label-sep", "group-sep", "label-border", "group-border",
            "sep4", "label-progress", "progress-row",
            "sep5", "nav",
          ],
        },
        step: { type: "badge", props: { label: `Items & Groups \u00b7 ${step("items")}` } },
        heading: { type: "text", props: { content: "Items, variants, action slots, and group styles.", size: "sm" } },

        // Item variants
        sep1: { type: "separator", props: {} },
        "label-variants": { type: "text", props: { content: "Item Variants", size: "sm", weight: "bold" } },
        "v-default": { type: "item", props: { title: "Default", description: "No background, no border" } },

        // Items with action children
        sep2: { type: "separator", props: {} },
        "label-actions": { type: "text", props: { content: "Action Slots", size: "sm", weight: "bold" } },
        "a-badge": {
          type: "item",
          props: { title: "Trending Cast", description: "842 likes in the last hour" },
          children: ["a-badge-v"],
        },
        "a-badge-v": { type: "badge", props: { label: "Hot", color: "red", icon: "flame" } },
        "a-icon": {
          type: "item",
          props: { title: "Weekly Digest", description: "Your personalized summary" },
          children: ["a-icon-v"],
        },
        "a-icon-v": { type: "icon", props: { name: "chevron-right", color: "gray" } },
        "a-button": {
          type: "item",
          props: { title: "Share this Snap", description: "Pre-fill the composer" },
          children: ["a-button-v"],
        },
        "a-button-v": {
          type: "button",
          props: { label: "Share", icon: "share" },
          on: { press: { action: "compose_cast", params: { text: "Check out Snaps!" } } },
        },

        // Group styles
        sep3: { type: "separator", props: {} },
        "label-groups": { type: "text", props: { content: "Item Groups", size: "sm", weight: "bold" } },
        "label-sep": { type: "text", props: { content: "With separators", size: "sm" } },
        "group-sep": {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["gs1", "gs2", "gs3"],
        },
        gs1: { type: "item", props: { title: "Notifications" }, children: ["gs1-i"] },
        "gs1-i": { type: "icon", props: { name: "chevron-right", color: "gray" } },
        gs2: { type: "item", props: { title: "Privacy" }, children: ["gs2-i"] },
        "gs2-i": { type: "icon", props: { name: "chevron-right", color: "gray" } },
        gs3: { type: "item", props: { title: "Account" }, children: ["gs3-i"] },
        "gs3-i": { type: "icon", props: { name: "chevron-right", color: "gray" } },
        "label-border": { type: "text", props: { content: "With border", size: "sm" } },
        "group-border": {
          type: "item_group",
          props: { border: true, separator: true, gap: "sm" },
          children: ["gb1", "gb2", "gb3"],
        },
        gb1: { type: "item", props: { title: "dwr.eth", description: "2,847 pts" }, children: ["gb1-b"] },
        "gb1-b": { type: "badge", props: { label: "#1", color: "amber", icon: "trophy" } },
        gb2: { type: "item", props: { title: "v.eth", description: "2,103 pts" }, children: ["gb2-b"] },
        "gb2-b": { type: "badge", props: { label: "#2", color: "gray" } },
        gb3: { type: "item", props: { title: "horsefacts.eth", description: "1,892 pts" }, children: ["gb3-b"] },
        "gb3-b": { type: "badge", props: { label: "#3", color: "gray" } },

        // Progress bars
        sep4: { type: "separator", props: {} },
        "label-progress": { type: "text", props: { content: "Progress Bars", size: "sm", weight: "bold" } },
        "progress-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["pr1", "pr2"],
        },
        pr1: { type: "progress", props: { value: 78, max: 100, label: "Engagement" } },
        pr2: { type: "progress", props: { value: 45, max: 100, label: "Completion" } },

        sep5: { type: "separator", props: {} },
        ...nav(base, "items"),
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
          children: ["step", "heading", "sep1", "row", "sep2", "leaderboard", "sep3", "metrics", "sep4", "nav"],
        },
        step: { type: "badge", props: { label: `Layout \u00b7 ${step("layout")}` } },
        heading: {
          type: "text",
          props: { content: "Horizontal stacks, item groups, and composition.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        row: {
          type: "stack",
          props: { direction: "horizontal" },
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
        sep2: { type: "separator", props: {} },
        leaderboard: {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["lb1", "lb2", "lb3", "lb4"],
        },
        lb1: { type: "item", props: { title: "dwr.eth", description: "2,847 pts" }, children: ["lb1-r"] },
        "lb1-r": { type: "badge", props: { label: "#1", color: "amber", icon: "trophy" } },
        lb2: { type: "item", props: { title: "v.eth", description: "2,103 pts" }, children: ["lb2-r"] },
        "lb2-r": { type: "badge", props: { label: "#2", color: "gray" } },
        lb3: { type: "item", props: { title: "horsefacts.eth", description: "1,892 pts" }, children: ["lb3-r"] },
        "lb3-r": { type: "badge", props: { label: "#3", color: "gray" } },
        lb4: { type: "item", props: { title: "les.eth", description: "1,654 pts" }, children: ["lb4-r"] },
        "lb4-r": { type: "badge", props: { label: "#4", color: "gray" } },
        sep3: { type: "separator", props: {} },
        metrics: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["m1", "m2"],
        },
        m1: { type: "progress", props: { value: 89, max: 100, label: "Uptime" } },
        m2: { type: "progress", props: { value: 67, max: 100, label: "Adoption" } },
        sep4: { type: "separator", props: {} },
        ...nav(base, "layout"),
      },
    },
  };
}

function dataPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "step", "chart-label", "chart", "sep", "grid-label", "grid", "sep2", "multi-label", "multi-grid", "nav"],
        },
        heading: {
          type: "text",
          props: { content: "Data Components", weight: "bold" },
        },
        step: {
          type: "text",
          props: { content: `${step("data")} — bar_chart and cell_grid`, size: "sm" },
        },
        "chart-label": {
          type: "text",
          props: { content: "bar_chart — poll results", size: "sm" },
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
        sep: { type: "separator", props: {} },
        "grid-label": {
          type: "text",
          props: { content: "cell_grid — 4×4 color grid", size: "sm" },
        },
        grid: {
          type: "cell_grid",
          props: {
            name: "color_grid",
            cols: 4,
            rows: 4,
            select: "single",
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
        },
        sep2: { type: "separator", props: {} },
        "multi-label": {
          type: "text",
          props: { content: "cell_grid — multiselect 3×3", size: "sm" },
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
        ...nav(base, "data"),
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
          children: ["step", "heading", "sep1", "name-input", "tip-input", "frequency", "sep2", "collab", "discovery", "sep3", "interest", "skills", "sep4", "submit", "nav"],
        },
        step: { type: "badge", props: { label: `Form \u00b7 ${step("form")}` } },
        heading: {
          type: "text",
          props: { content: "Every input type. Fill it out and submit.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
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
        sep2: { type: "separator", props: {} },
        collab: { type: "switch", props: { name: "collaborations", label: "Open to collaborations" } },
        discovery: { type: "switch", props: { name: "discovery", label: "Show in discovery", defaultChecked: true } },
        sep3: { type: "separator", props: {} },
        interest: {
          type: "toggle_group",
          props: { name: "interest", label: "Primary Interest", options: ["Protocol", "Apps", "Culture"] },
        },
        skills: {
          type: "toggle_group",
          props: { name: "skills", label: "Skills (select multiple)", multiple: true, orientation: "vertical", options: ["Solidity", "TypeScript", "Design", "Product"] },
        },
        sep4: { type: "separator", props: {} },
        submit: {
          type: "button",
          props: { label: "Save Profile", variant: "primary", icon: "check" },
          on: { press: { action: "submit", params: { target: `${base}/?view=results` } } },
        },
        ...nav(base, "form"),
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
          children: ["heading", "subtitle", "sep", "results", "sep2", "btns"],
        },
        heading: { type: "text", props: { content: "Profile Saved!", size: "md", align: "center" } },
        subtitle: { type: "text", props: { content: `Welcome, ${displayName}!`, size: "sm", align: "center" } },
        sep: { type: "separator", props: {} },
        results: {
          type: "item_group",
          props: { separator: true, gap: "sm" },
          children: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"],
        },
        r1: { type: "item", props: { title: "Name" }, children: ["r1v"] },
        r1v: { type: "badge", props: { label: displayName, icon: "user" } },
        r2: { type: "item", props: { title: "Tip" }, children: ["r2v"] },
        r2v: { type: "badge", props: { label: `$${tipAmount}`, color: "green", icon: "coins" } },
        r3: { type: "item", props: { title: "Frequency" }, children: ["r3v"] },
        r3v: { type: "badge", props: { label: `${frequency}/10`, color: "blue" } },
        r4: { type: "item", props: { title: "Collaborations" }, children: ["r4v"] },
        r4v: { type: "badge", props: { label: collaborations, color: collaborations === "Yes" ? "green" : "gray", icon: collaborations === "Yes" ? "check" : "x" } },
        r5: { type: "item", props: { title: "Discovery" }, children: ["r5v"] },
        r5v: { type: "badge", props: { label: discovery, color: discovery === "Yes" ? "green" : "gray", icon: discovery === "Yes" ? "check" : "x" } },
        r6: { type: "item", props: { title: "Interest" }, children: ["r6v"] },
        r6v: { type: "badge", props: { label: interest, color: "amber", icon: "star" } },
        r7: { type: "item", props: { title: "Skills" }, children: ["r7v"] },
        r7v: { type: "badge", props: { label: skills || "None", color: "teal", icon: "zap" } },
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
          children: ["step", "heading", "sep1", "nav-label", "nav-actions", "sep2", "social-label", "social-actions", "sep3", "token-label", "token-actions", "sep4", "nav"],
        },
        step: { type: "badge", props: { label: `Actions \u00b7 ${step("actions")}` } },
        heading: {
          type: "text",
          props: { content: "9 action types. Navigation, social, and tokens.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
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
        sep2: { type: "separator", props: {} },
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
          on: { press: { action: "compose_cast", params: { text: "Check out the Snap Component Catalog!" } } },
        },
        sep3: { type: "separator", props: {} },
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
          on: { press: { action: "view_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" } } },
        },
        "a-send": {
          type: "item",
          props: { title: "Send USDC", description: "Pre-filled amount" },
          children: ["a-send-btn"],
        },
        "a-send-btn": {
          type: "button",
          props: { label: "Send", icon: "coins" },
          on: { press: { action: "send_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", amount: "10.00", recipientFid: 3 } } },
        },
        "a-swap": {
          type: "item",
          props: { title: "Swap ETH \u2192 USDC", description: "Open swap interface" },
          children: ["a-swap-btn"],
        },
        "a-swap-btn": {
          type: "button",
          props: { label: "Swap", icon: "refresh-cw" },
          on: { press: { action: "swap_token", params: { sellToken: "eip155:8453/slip44:60", buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" } } },
        },
        sep4: { type: "separator", props: {} },
        nav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["nav-back", "nav-start"],
        },
        "nav-back": {
          type: "button",
          props: { label: "Back", icon: "arrow-left" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "nav-start": {
          type: "button",
          props: { label: "Start Over", icon: "refresh-cw" },
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
