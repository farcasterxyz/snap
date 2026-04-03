import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View = "welcome" | "display" | "layout" | "form" | "results" | "actions";

const VIEWS: View[] = ["welcome", "display", "layout", "form", "actions"];

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
    case "display":
      return displayPage(base);
    case "layout":
      return layoutPage(base);
    case "form":
      return formPage(base);
    case "actions":
      return actionsPage(base);
    default:
      return welcomePage(base);
  }
});

export default app;

// ─── Helpers ────────────────────────────────────────────

function nav(base: string, current: View): Record<string, object> {
  const idx = VIEWS.indexOf(current);
  const prev = idx > 0 ? VIEWS[idx - 1] : null;
  const next = idx < VIEWS.length - 1 ? VIEWS[idx + 1] : null;

  return {
    nav: {
      type: "stack",
      props: { direction: "horizontal", gap: "sm" },
      children: [
        ...(prev ? ["nav-prev"] : []),
        "nav-home",
        ...(next ? ["nav-next"] : []),
      ],
    },
    ...(prev
      ? {
          "nav-prev": {
            type: "button",
            props: { label: "Back", variant: "ghost", icon: "arrow-left" },
            on: { press: { action: "submit", params: { target: `${base}/?view=${prev}` } } },
          },
        }
      : {}),
    "nav-home": {
      type: "button",
      props: { label: "Home", variant: "ghost", icon: "star" },
      on: { press: { action: "submit", params: { target: `${base}/` } } },
    },
    ...(next
      ? {
          "nav-next": {
            type: "button",
            props: { label: "Next", variant: "ghost", icon: "arrow-right" },
            on: { press: { action: "submit", params: { target: `${base}/?view=${next}` } } },
          },
        }
      : {}),
  };
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
          props: { gap: "md" },
          children: ["heading", "tagline", "hero", "stats", "sep", "cta-row"],
        },
        heading: {
          type: "text",
          props: { content: "Farcaster Snaps", size: "lg", align: "center" },
        },
        tagline: {
          type: "text",
          props: {
            content: "Interactive feed cards powered by json-render. 14 components, 9 actions, infinite possibilities.",
            size: "sm",
            align: "center",
          },
        },
        hero: {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=450&fit=crop&auto=format",
            aspect: "16:9",
            alt: "Abstract purple gradient",
          },
        },
        stats: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["stat-components", "stat-actions", "stat-version"],
        },
        "stat-components": {
          type: "badge",
          props: { label: "14 Components", icon: "zap" },
        },
        "stat-actions": {
          type: "badge",
          props: { label: "9 Actions", color: "blue", icon: "trending-up" },
        },
        "stat-version": {
          type: "badge",
          props: { label: "v1.0", color: "green", icon: "check" },
        },
        sep: { type: "separator", props: {} },
        "cta-row": {
          type: "stack",
          props: { gap: "sm" },
          children: ["cta-explore", "cta-form"],
        },
        "cta-explore": {
          type: "button",
          props: { label: "Explore Components" },
          on: { press: { action: "submit", params: { target: `${base}/?view=display` } } },
        },
        "cta-form": {
          type: "button",
          props: { label: "Try the Form Demo", variant: "outline", icon: "arrow-right" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
      },
    },
  };
}

function displayPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "blue" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "subtitle", "sep1", "content-list", "sep2", "progress-section", "sep3", "icon-row", "nav"],
        },
        heading: {
          type: "text",
          props: { content: "Display Components", size: "lg" },
        },
        subtitle: {
          type: "text",
          props: { content: "Content primitives for building rich feed cards.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "content-list": {
          type: "item_group",
          props: {},
          children: ["item-trending", "item-digest", "item-update"],
        },
        "item-trending": {
          type: "item",
          props: { title: "Trending Cast", description: "842 likes in the last hour" },
          children: ["trending-badge"],
        },
        "trending-badge": {
          type: "badge",
          props: { label: "Hot", color: "red", icon: "flame" },
        },
        "item-digest": {
          type: "item",
          props: { title: "Weekly Digest", description: "Your personalized feed summary", variant: "outline" },
          children: ["digest-icon"],
        },
        "digest-icon": {
          type: "icon",
          props: { name: "chevron-right", color: "gray" },
        },
        "item-update": {
          type: "item",
          props: { title: "Community Update", description: "3 new proposals to review", variant: "muted" },
          children: ["update-badge"],
        },
        "update-badge": {
          type: "badge",
          props: { label: "3 New", color: "blue", icon: "info" },
        },
        sep2: { type: "separator", props: {} },
        "progress-section": {
          type: "stack",
          props: { gap: "sm" },
          children: ["prog-engagement", "prog-completion"],
        },
        "prog-engagement": {
          type: "progress",
          props: { value: 78, max: 100, label: "Engagement Score" },
        },
        "prog-completion": {
          type: "progress",
          props: { value: 45, max: 100, label: "Quest Completion" },
        },
        sep3: { type: "separator", props: {} },
        "icon-row": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["ic1", "ic2", "ic3", "ic4", "ic5", "ic6", "ic7", "ic8"],
        },
        ic1: { type: "icon", props: { name: "heart", color: "red" } },
        ic2: { type: "icon", props: { name: "star", color: "amber" } },
        ic3: { type: "icon", props: { name: "zap", color: "purple" } },
        ic4: { type: "icon", props: { name: "trophy", color: "amber" } },
        ic5: { type: "icon", props: { name: "flame", color: "red" } },
        ic6: { type: "icon", props: { name: "thumbs-up", color: "blue" } },
        ic7: { type: "icon", props: { name: "trending-up", color: "green" } },
        ic8: { type: "icon", props: { name: "gift", color: "pink" } },
        ...nav(base, "display"),
      },
    },
  };
}

function layoutPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "teal" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "subtitle", "sep1", "side-by-side", "sep2", "leaderboard", "sep3", "metric-row", "nav"],
        },
        heading: {
          type: "text",
          props: { content: "Layout & Containers", size: "lg" },
        },
        subtitle: {
          type: "text",
          props: { content: "Stacks, groups, and composition patterns.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "side-by-side": {
          type: "stack",
          props: { direction: "horizontal", gap: "md" },
          children: ["left-card", "right-card"],
        },
        "left-card": {
          type: "item",
          props: { title: "Protocol", description: "12 proposals", variant: "outline" },
          children: ["left-icon"],
        },
        "left-icon": {
          type: "icon",
          props: { name: "trending-up", color: "green" },
        },
        "right-card": {
          type: "item",
          props: { title: "Governance", description: "3 active votes", variant: "outline" },
          children: ["right-icon"],
        },
        "right-icon": {
          type: "icon",
          props: { name: "users", color: "blue" },
        },
        sep2: { type: "separator", props: {} },
        leaderboard: {
          type: "item_group",
          props: {},
          children: ["lb-1", "lb-2", "lb-3", "lb-4"],
        },
        "lb-1": {
          type: "item",
          props: { title: "dwr.eth", description: "2,847 points" },
          children: ["lb-1-rank"],
        },
        "lb-1-rank": { type: "badge", props: { label: "#1", color: "amber", icon: "trophy" } },
        "lb-2": {
          type: "item",
          props: { title: "v.eth", description: "2,103 points" },
          children: ["lb-2-rank"],
        },
        "lb-2-rank": { type: "badge", props: { label: "#2", color: "gray" } },
        "lb-3": {
          type: "item",
          props: { title: "horsefacts.eth", description: "1,892 points" },
          children: ["lb-3-rank"],
        },
        "lb-3-rank": { type: "badge", props: { label: "#3", color: "gray" } },
        "lb-4": {
          type: "item",
          props: { title: "les.eth", description: "1,654 points" },
          children: ["lb-4-rank"],
        },
        "lb-4-rank": { type: "badge", props: { label: "#4", color: "gray" } },
        sep3: { type: "separator", props: {} },
        "metric-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["metric-1", "metric-2"],
        },
        "metric-1": {
          type: "progress",
          props: { value: 89, max: 100, label: "Uptime" },
        },
        "metric-2": {
          type: "progress",
          props: { value: 67, max: 100, label: "Adoption" },
        },
        ...nav(base, "layout"),
      },
    },
  };
}

function formPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["heading", "subtitle", "sep1", "name-input", "tip-input", "frequency", "sep2", "collab-switch", "discovery-switch", "sep3", "interest-group", "skills-group", "sep4", "save-btn", "nav"],
        },
        heading: {
          type: "text",
          props: { content: "Profile Setup", size: "lg" },
        },
        subtitle: {
          type: "text",
          props: { content: "Customize your Farcaster profile. All fields are interactive.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "name-input": {
          type: "input",
          props: { name: "displayName", type: "text", label: "Display Name", placeholder: "Enter your name" },
        },
        "tip-input": {
          type: "input",
          props: { name: "tipAmount", type: "number", label: "Default Tip (USDC)", placeholder: "1.00" },
        },
        frequency: {
          type: "slider",
          props: { name: "frequency", label: "Content Frequency", min: 1, max: 10, step: 1, defaultValue: 5 },
        },
        sep2: { type: "separator", props: {} },
        "collab-switch": {
          type: "switch",
          props: { name: "collaborations", label: "Open to collaborations" },
        },
        "discovery-switch": {
          type: "switch",
          props: { name: "discovery", label: "Show in discovery", defaultChecked: true },
        },
        sep3: { type: "separator", props: {} },
        "interest-group": {
          type: "toggle_group",
          props: {
            name: "interest",
            label: "Primary Interest",
            options: ["Protocol", "Apps", "Culture", "Art"],
          },
        },
        "skills-group": {
          type: "toggle_group",
          props: {
            name: "skills",
            label: "Skills",
            multiple: true,
            orientation: "vertical",
            options: ["Solidity", "TypeScript", "Design", "Product", "Community"],
          },
        },
        sep4: { type: "separator", props: {} },
        "save-btn": {
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
          children: ["heading", "subtitle", "sep", "results-group", "sep2", "btn-row"],
        },
        heading: {
          type: "text",
          props: { content: "Profile Saved!", size: "lg", align: "center" },
        },
        subtitle: {
          type: "text",
          props: { content: `Welcome to Farcaster, ${displayName}!`, size: "sm", align: "center" },
        },
        sep: { type: "separator", props: {} },
        "results-group": {
          type: "item_group",
          props: {},
          children: ["r-name", "r-tip", "r-freq", "r-collab", "r-disc", "r-interest", "r-skills"],
        },
        "r-name": { type: "item", props: { title: "Display Name" }, children: ["r-name-v"] },
        "r-name-v": { type: "badge", props: { label: displayName, icon: "user" } },
        "r-tip": { type: "item", props: { title: "Default Tip" }, children: ["r-tip-v"] },
        "r-tip-v": { type: "badge", props: { label: `$${tipAmount}`, color: "green", icon: "coins" } },
        "r-freq": { type: "item", props: { title: "Content Frequency" }, children: ["r-freq-v"] },
        "r-freq-v": { type: "badge", props: { label: `${frequency}/10`, color: "blue" } },
        "r-collab": { type: "item", props: { title: "Collaborations" }, children: ["r-collab-v"] },
        "r-collab-v": { type: "badge", props: { label: collaborations, color: collaborations === "Yes" ? "green" : "gray", icon: collaborations === "Yes" ? "check" : "x" } },
        "r-disc": { type: "item", props: { title: "Discovery" }, children: ["r-disc-v"] },
        "r-disc-v": { type: "badge", props: { label: discovery, color: discovery === "Yes" ? "green" : "gray", icon: discovery === "Yes" ? "check" : "x" } },
        "r-interest": { type: "item", props: { title: "Primary Interest" }, children: ["r-interest-v"] },
        "r-interest-v": { type: "badge", props: { label: interest, color: "amber", icon: "star" } },
        "r-skills": { type: "item", props: { title: "Skills" }, children: ["r-skills-v"] },
        "r-skills-v": { type: "badge", props: { label: skills || "None", color: "teal", icon: "zap" } },
        sep2: { type: "separator", props: {} },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["btn-edit", "btn-profile"],
        },
        "btn-edit": {
          type: "button",
          props: { label: "Edit Profile", variant: "outline", icon: "arrow-left" },
          on: { press: { action: "submit", params: { target: `${base}/?view=form` } } },
        },
        "btn-profile": {
          type: "button",
          props: { label: "View Profile", icon: "user" },
          on: { press: { action: "view_profile", params: { fid: 3 } } },
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
          children: [
            "heading", "subtitle", "sep1",
            "nav-label", "action-nav",
            "sep2",
            "social-label", "action-social",
            "sep3",
            "token-label", "action-tokens",
            "sep4",
            "nav",
          ],
        },
        heading: {
          type: "text",
          props: { content: "Actions & Integrations", size: "lg" },
        },
        subtitle: {
          type: "text",
          props: { content: "Every action the spec supports — navigation, social, and tokens.", size: "sm" },
        },
        sep1: { type: "separator", props: {} },
        "nav-label": {
          type: "text",
          props: { content: "Navigation", size: "md", weight: "bold" },
        },
        "action-nav": {
          type: "item_group",
          props: {},
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
          props: { title: "Launch Mini App", description: "Opens as an in-app experience" },
          children: ["a-miniapp-btn"],
        },
        "a-miniapp-btn": {
          type: "button",
          props: { label: "Launch", variant: "outline", icon: "arrow-right" },
          on: { press: { action: "open_mini_app", params: { target: "https://farcaster.xyz" } } },
        },
        sep2: { type: "separator", props: {} },
        "social-label": {
          type: "text",
          props: { content: "Social", size: "md", weight: "bold" },
        },
        "action-social": {
          type: "item_group",
          props: {},
          children: ["a-profile", "a-cast", "a-compose"],
        },
        "a-profile": {
          type: "item",
          props: { title: "View @dwr's Profile", description: "Navigate to a user profile" },
          children: ["a-profile-btn"],
        },
        "a-profile-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "user" },
          on: { press: { action: "view_profile", params: { fid: 3 } } },
        },
        "a-cast": {
          type: "item",
          props: { title: "View a Cast", description: "Navigate to a specific cast" },
          children: ["a-cast-btn"],
        },
        "a-cast-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "message-circle" },
          on: { press: { action: "view_cast", params: { hash: "0x0000000000000000000000000000000000000001" } } },
        },
        "a-compose": {
          type: "item",
          props: { title: "Share this Snap", description: "Pre-fill the cast composer" },
          children: ["a-compose-btn"],
        },
        "a-compose-btn": {
          type: "button",
          props: { label: "Share", variant: "outline", icon: "share" },
          on: { press: { action: "compose_cast", params: { text: "Check out the Snap Component Catalog! Built with 14 components and 9 action types." } } },
        },
        sep3: { type: "separator", props: {} },
        "token-label": {
          type: "text",
          props: { content: "Tokens", size: "md", weight: "bold" },
        },
        "action-tokens": {
          type: "item_group",
          props: {},
          children: ["a-view-token", "a-send", "a-swap"],
        },
        "a-view-token": {
          type: "item",
          props: { title: "View USDC on Base", description: "Open token details in wallet" },
          children: ["a-view-token-btn"],
        },
        "a-view-token-btn": {
          type: "button",
          props: { label: "View", variant: "outline", icon: "wallet" },
          on: { press: { action: "view_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" } } },
        },
        "a-send": {
          type: "item",
          props: { title: "Send USDC", description: "Open send flow with pre-filled amount" },
          children: ["a-send-btn"],
        },
        "a-send-btn": {
          type: "button",
          props: { label: "Send", variant: "outline", icon: "coins" },
          on: { press: { action: "send_token", params: { token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", amount: "10.00", recipientFid: 3 } } },
        },
        "a-swap": {
          type: "item",
          props: { title: "Swap ETH to USDC", description: "Open swap interface" },
          children: ["a-swap-btn"],
        },
        "a-swap-btn": {
          type: "button",
          props: { label: "Swap", variant: "outline", icon: "refresh-cw" },
          on: { press: { action: "swap_token", params: { sellToken: "eip155:8453/slip44:60", buyToken: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" } } },
        },
        sep4: { type: "separator", props: {} },
        ...nav(base, "actions"),
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
