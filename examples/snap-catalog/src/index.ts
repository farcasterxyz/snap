import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View =
  | "welcome"
  | "typography"
  | "images"
  | "content"
  | "layout"
  | "form"
  | "results"
  | "actions";

const FLOW: View[] = [
  "welcome",
  "typography",
  "images",
  "content",
  "layout",
  "form",
  "actions",
];

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const view = (url.searchParams.get("view") ?? "welcome") as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") return welcomePage(base);
  if (view === "results" && ctx.action.type === "post") {
    return resultsPage(base, ctx.action.inputs);
  }

  switch (view) {
    case "typography": return typographyPage(base);
    case "images": return imagesPage(base);
    case "content": return contentPage(base);
    case "layout": return layoutPage(base);
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
      props: { label: "Back", variant: "ghost", icon: "arrow-left" },
      on: { press: { action: "submit", params: { target: `${base}/?view=${prev}` } } },
    };
  }

  if (next) {
    children.push("nav-next");
    elements["nav-next"] = {
      type: "button",
      props: { label: "Next", variant: "outline", icon: "arrow-right" },
      on: { press: { action: "submit", params: { target: `${base}/?view=${next}` } } },
    };
  }

  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal" },
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
    version: "1.0",
    theme: { accent: "purple" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "tagline", "hero", "stats", "sep", "start"],
        },
        heading: {
          type: "text",
          props: { content: "Farcaster Snaps", size: "lg", align: "center" },
        },
        tagline: {
          type: "text",
          props: { content: "Interactive feed cards. 14 components, 9 actions, one spec.", size: "sm", align: "center" },
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
        s1: { type: "badge", props: { label: "14 Components", icon: "zap" } },
        s2: { type: "badge", props: { label: "9 Actions", color: "blue", icon: "trending-up" } },
        s3: { type: "badge", props: { label: "v1.0", color: "green", icon: "check" } },
        sep: { type: "separator", props: {} },
        start: {
          type: "button",
          props: { label: "Get Started", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=typography` } } },
        },
      },
    },
  };
}

function typographyPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "blue" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["step", "heading", "sep1", "t-lg", "t-md", "t-sm", "sep2", "t-bold", "t-medium", "t-normal", "sep3", "t-center", "t-right", "sep4", "nav"],
        },
        step: { type: "badge", props: { label: `Typography \u00b7 ${step("typography")}` } },
        heading: {
          type: "text",
          props: { content: "Text sizes, weights, and alignment.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "t-lg": { type: "text", props: { content: "Large \u2014 headings and titles", size: "lg" } },
        "t-md": { type: "text", props: { content: "Medium \u2014 body text and descriptions. This is the default size for most content in a snap." } },
        "t-sm": { type: "text", props: { content: "Small \u2014 captions, metadata, timestamps", size: "sm" } },
        sep2: { type: "separator", props: {} },
        "t-bold": { type: "text", props: { content: "Bold weight", weight: "bold" } },
        "t-medium": { type: "text", props: { content: "Medium weight", weight: "medium" } },
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
    version: "1.0",
    theme: { accent: "teal" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["step", "heading", "sep1", "img-wide", "label-wide", "row-sq-43", "label-sq-43", "sep2", "row-34-916", "label-34-916", "sep3", "nav"],
        },
        step: { type: "badge", props: { label: `Images \u00b7 ${step("images")}` } },
        heading: {
          type: "text",
          props: { content: "All five aspect ratios.", size: "sm" },
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
        "row-34-916": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["img-34", "img-916"],
        },
        "img-34": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=450&h=600&fit=crop&auto=format",
            aspect: "3:4",
          },
        },
        "img-916": {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=360&h=640&fit=crop&auto=format",
            aspect: "9:16",
          },
        },
        "label-34-916": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["lbl-34", "lbl-916"],
        },
        "lbl-34": { type: "text", props: { content: "3:4", size: "sm", align: "center" } },
        "lbl-916": { type: "text", props: { content: "9:16", size: "sm", align: "center" } },
        sep3: { type: "separator", props: {} },
        ...nav(base, "images"),
      },
    },
  };
}

function contentPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["step", "heading", "sep1", "badges", "sep2", "items", "sep3", "progress-row", "sep4", "icons", "sep5", "nav"],
        },
        step: { type: "badge", props: { label: `Content \u00b7 ${step("content")}` } },
        heading: {
          type: "text",
          props: { content: "Badges, items, progress bars, and icons.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        badges: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["b1", "b2", "b3", "b4", "b5"],
        },
        b1: { type: "badge", props: { label: "Default" } },
        b2: { type: "badge", props: { label: "Blue", color: "blue" } },
        b3: { type: "badge", props: { label: "Red", color: "red", icon: "flame" } },
        b4: { type: "badge", props: { label: "Green", color: "green", icon: "check" } },
        b5: { type: "badge", props: { label: "Gray", color: "gray" } },
        sep2: { type: "separator", props: {} },
        items: {
          type: "item_group",
          props: { separator: true },
          children: ["i1", "i2", "i3"],
        },
        i1: {
          type: "item",
          props: { title: "Trending Cast", description: "842 likes in the last hour" },
          children: ["i1-badge"],
        },
        "i1-badge": { type: "badge", props: { label: "Hot", color: "red", icon: "flame" } },
        i2: {
          type: "item",
          props: { title: "Weekly Digest", description: "Your personalized summary", variant: "outline" },
          children: ["i2-icon"],
        },
        "i2-icon": { type: "icon", props: { name: "chevron-right", color: "gray" } },
        i3: {
          type: "item",
          props: { title: "Community Update", description: "3 new proposals", variant: "muted" },
          children: ["i3-badge"],
        },
        "i3-badge": { type: "badge", props: { label: "3 New", color: "blue", icon: "info" } },
        sep3: { type: "separator", props: {} },
        "progress-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["p1", "p2"],
        },
        p1: { type: "progress", props: { value: 78, max: 100, label: "Engagement" } },
        p2: { type: "progress", props: { value: 45, max: 100, label: "Completion" } },
        sep4: { type: "separator", props: {} },
        icons: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["ic1", "ic2", "ic3", "ic4", "ic5", "ic6", "ic7", "ic8"],
        },
        ic1: { type: "icon", props: { name: "heart", color: "red" } },
        ic2: { type: "icon", props: { name: "star", color: "amber" } },
        ic3: { type: "icon", props: { name: "zap", color: "purple" } },
        ic4: { type: "icon", props: { name: "trophy", color: "amber" } },
        ic5: { type: "icon", props: { name: "thumbs-up", color: "blue" } },
        ic6: { type: "icon", props: { name: "trending-up", color: "green" } },
        ic7: { type: "icon", props: { name: "gift", color: "pink" } },
        ic8: { type: "icon", props: { name: "bookmark", color: "gray" } },
        sep5: { type: "separator", props: {} },
        ...nav(base, "content"),
      },
    },
  };
}

function layoutPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    spec: {
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
          props: { title: "Protocol", description: "12 proposals", variant: "outline" },
          children: ["card-l-icon"],
        },
        "card-l-icon": { type: "icon", props: { name: "trending-up", color: "green" } },
        "card-r": {
          type: "item",
          props: { title: "Governance", description: "3 active votes", variant: "outline" },
          children: ["card-r-icon"],
        },
        "card-r-icon": { type: "icon", props: { name: "users", color: "blue" } },
        sep2: { type: "separator", props: {} },
        leaderboard: {
          type: "item_group",
          props: { separator: true },
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

function formPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "teal" },
    spec: {
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
          props: { name: "interest", label: "Primary Interest", options: ["Protocol", "Apps", "Culture", "Art"] },
        },
        skills: {
          type: "toggle_group",
          props: { name: "skills", label: "Skills (select multiple)", multiple: true, options: ["Solidity", "TypeScript", "Design", "Product"] },
        },
        sep4: { type: "separator", props: {} },
        submit: {
          type: "button",
          props: { label: "Save Profile", icon: "check" },
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
    version: "1.0",
    theme: { accent: "green" },
    effects: ["confetti"],
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "subtitle", "sep", "results", "sep2", "btns"],
        },
        heading: { type: "text", props: { content: "Profile Saved!", size: "lg", align: "center" } },
        subtitle: { type: "text", props: { content: `Welcome, ${displayName}!`, size: "sm", align: "center" } },
        sep: { type: "separator", props: {} },
        results: {
          type: "item_group",
          props: { separator: true },
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
          props: { label: "Edit", variant: "outline", icon: "arrow-left" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "btn-next": {
          type: "button",
          props: { label: "Continue", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=actions` } } },
        },
      },
    },
  };
}

function actionsPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "pink" },
    spec: {
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
          props: { separator: true },
          children: ["a-url", "a-miniapp"],
        },
        "a-url": {
          type: "item",
          props: { title: "Open Farcaster", description: "Opens in system browser" },
          children: ["a-url-btn"],
        },
        "a-url-btn": {
          type: "button",
          props: { label: "Open", variant: "outline", icon: "external-link" },
          on: { press: { action: "open_url", params: { target: "https://farcaster.xyz" } } },
        },
        "a-miniapp": {
          type: "item",
          props: { title: "Launch Mini App", description: "In-app experience" },
          children: ["a-miniapp-btn"],
        },
        "a-miniapp-btn": {
          type: "button",
          props: { label: "Launch", variant: "outline", icon: "arrow-right" },
          on: { press: { action: "open_mini_app", params: { target: "https://farcaster.xyz" } } },
        },
        sep2: { type: "separator", props: {} },
        "social-label": { type: "text", props: { content: "Social", weight: "bold" } },
        "social-actions": {
          type: "item_group",
          props: { separator: true },
          children: ["a-profile", "a-cast", "a-compose"],
        },
        "a-profile": {
          type: "item",
          props: { title: "View Profile", description: "Navigate to @dwr" },
          children: ["a-profile-btn"],
        },
        "a-profile-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "user" },
          on: { press: { action: "view_profile", params: { fid: 3 } } },
        },
        "a-cast": {
          type: "item",
          props: { title: "View Cast", description: "Open a specific cast" },
          children: ["a-cast-btn"],
        },
        "a-cast-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "message-circle" },
          on: { press: { action: "view_cast", params: { hash: "0x0000000000000000000000000000000000000001" } } },
        },
        "a-compose": {
          type: "item",
          props: { title: "Share this Snap", description: "Pre-fill the composer" },
          children: ["a-compose-btn"],
        },
        "a-compose-btn": {
          type: "button",
          props: { label: "Share", variant: "outline", icon: "share" },
          on: { press: { action: "compose_cast", params: { text: "Check out the Snap Component Catalog!" } } },
        },
        sep3: { type: "separator", props: {} },
        "token-label": { type: "text", props: { content: "Tokens", weight: "bold" } },
        "token-actions": {
          type: "item_group",
          props: { separator: true },
          children: ["a-token", "a-send", "a-swap"],
        },
        "a-token": {
          type: "item",
          props: { title: "View USDC", description: "Open in wallet" },
          children: ["a-token-btn"],
        },
        "a-token-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "wallet" },
          on: { press: { action: "view_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" } } },
        },
        "a-send": {
          type: "item",
          props: { title: "Send USDC", description: "Pre-filled amount" },
          children: ["a-send-btn"],
        },
        "a-send-btn": {
          type: "button",
          props: { label: "Send", variant: "outline", icon: "coins" },
          on: { press: { action: "send_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", amount: "10.00", recipientFid: 3 } } },
        },
        "a-swap": {
          type: "item",
          props: { title: "Swap ETH \u2192 USDC", description: "Open swap interface" },
          children: ["a-swap-btn"],
        },
        "a-swap-btn": {
          type: "button",
          props: { label: "Swap", variant: "outline", icon: "refresh-cw" },
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
          props: { label: "Back", variant: "ghost", icon: "arrow-left" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "nav-start": {
          type: "button",
          props: { label: "Start Over", variant: "outline", icon: "refresh-cw" },
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
