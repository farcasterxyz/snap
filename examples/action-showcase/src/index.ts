import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const MENU_NAME = "action_type" as const;
const OPT_CAST = "Cast";
const OPT_PROFILE = "Profile";
const OPT_TOKEN = "Token";
const OPT_SEND = "Send/Swap";

const USDC_BASE = "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const CBETH_BASE = "eip155:8453/erc20:0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEC22";
const CAST_HASH = "0x6cbdadf3f5cac3adfbce034145e4f035a37b7600";
const PROFILE_FID = 194;
const MINI_APP_URL = "https://ai.neynar.com";
const SEND_RECIPIENT_FID = 191;

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

let id = 0;
function uid(prefix = "e"): string {
  return `${prefix}_${++id}`;
}

function nav(base: string): Record<string, unknown> {
  const backId = uid("back");
  const homeId = uid("home");
  return {
    [backId]: {
      type: "button",
      props: { label: "← Back", variant: "ghost", icon: "arrow-left" },
      on: { press: { action: "submit", params: { target: `${base}/` } } },
    },
    [homeId]: {
      type: "button",
      props: { label: "Home", variant: "ghost", icon: "star" },
      on: { press: { action: "submit", params: { target: `${base}/` } } },
    },
  };
}

function navRow(base: string): { elements: Record<string, unknown>; id: string } {
  const navElements = nav(base);
  const childIds = Object.keys(navElements);
  const rowId = uid("nav");
  return {
    id: rowId,
    elements: {
      ...navElements,
      [rowId]: {
        type: "stack",
        props: { direction: "horizontal", gap: "sm", justify: "between" },
        children: childIds,
      },
    },
  };
}

const app = new Hono();

// Home page
registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  if (ctx.action.type === "post") {
    const selected = ctx.action.inputs[MENU_NAME];
    if (selected === OPT_CAST) return castPage(base);
    if (selected === OPT_PROFILE) return profilePage(base);
    if (selected === OPT_TOKEN) return tokenPage(base);
    if (selected === OPT_SEND) return sendSwapPage(base);
  }
  return homePage(base);
}, { path: "/" });

registerSnapHandler(app, async (ctx) => castPage(snapBaseUrl(ctx.request)), { path: "/cast" });
registerSnapHandler(app, async (ctx) => profilePage(snapBaseUrl(ctx.request)), { path: "/profile" });
registerSnapHandler(app, async (ctx) => tokenPage(snapBaseUrl(ctx.request)), { path: "/token" });
registerSnapHandler(app, async (ctx) => sendSwapPage(snapBaseUrl(ctx.request)), { path: "/send-swap" });

export default app;

function homePage(base: string): SnapHandlerResult {
  id = 0;
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "desc", "menu", "sep", "actions"] },
        title: { type: "text", props: { content: "Action Showcase", size: "lg", weight: "bold" } },
        desc: {
          type: "text",
          props: {
            content: "Explore all snap action types: submit, open_url, open_mini_app, and client actions. Pick a category below.",
            size: "sm",
          },
        },
        menu: {
          type: "toggle_group",
          props: {
            name: MENU_NAME,
            label: "Category",
            options: [OPT_CAST, OPT_PROFILE, OPT_TOKEN, OPT_SEND],
          },
        },
        sep: { type: "separator", props: {} },
        actions: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["go_btn", "mini_btn"],
        },
        go_btn: {
          type: "button",
          props: { label: "Go" },
          on: { press: { action: "submit", params: { target: `${base}/` } } },
        },
        mini_btn: {
          type: "button",
          props: { label: "Open Mini App", variant: "secondary", icon: "arrow-right" },
          on: { press: { action: "open_mini_app", params: { target: MINI_APP_URL } } },
        },
      },
    },
  };
}

function castPage(base: string): SnapHandlerResult {
  id = 0;
  const { id: navId, elements: navEls } = navRow(base);
  return {
    version: "1.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "desc", "hash_badge", "sep", "btn_row", navId] },
        title: { type: "text", props: { content: "Cast Actions", size: "lg", weight: "bold" } },
        desc: {
          type: "text",
          props: { content: "View a specific cast, or compose a new one with pre-filled text.", size: "sm" },
        },
        hash_badge: {
          type: "badge",
          props: { label: `Cast: ${CAST_HASH.slice(0, 10)}...`, color: "blue" },
        },
        sep: { type: "separator", props: {} },
        btn_row: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["view_cast_btn", "compose_btn"],
        },
        view_cast_btn: {
          type: "button",
          props: { label: "View Cast", icon: "message-circle" },
          on: { press: { action: "view_cast", params: { hash: CAST_HASH } } },
        },
        compose_btn: {
          type: "button",
          props: { label: "Compose Cast", variant: "secondary", icon: "share" },
          on: {
            press: {
              action: "compose_cast",
              params: { text: "Testing the Action Showcase snap!", channelKey: "farcaster" },
            },
          },
        },
        ...navEls,
      },
    },
  };
}

function profilePage(base: string): SnapHandlerResult {
  id = 0;
  const { id: navId, elements: navEls } = navRow(base);
  return {
    version: "1.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "desc", "info", "sep", "btn_row", navId] },
        title: { type: "text", props: { content: "Profile Actions", size: "lg", weight: "bold" } },
        desc: {
          type: "text",
          props: {
            content: `Open FID ${PROFILE_FID}'s profile in the Farcaster client, or visit a mini app.`,
            size: "sm",
          },
        },
        info: {
          type: "text",
          props: { content: "Uses client action view_profile and open_mini_app.", size: "sm" },
        },
        sep: { type: "separator", props: {} },
        btn_row: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["view_profile_btn", "mini_btn"],
        },
        view_profile_btn: {
          type: "button",
          props: { label: "View Profile", icon: "user" },
          on: { press: { action: "view_profile", params: { fid: PROFILE_FID } } },
        },
        mini_btn: {
          type: "button",
          props: { label: "Open Mini App", variant: "secondary", icon: "arrow-right" },
          on: { press: { action: "open_mini_app", params: { target: MINI_APP_URL } } },
        },
        ...navEls,
      },
    },
  };
}

function tokenPage(base: string): SnapHandlerResult {
  id = 0;
  const { id: navId, elements: navEls } = navRow(base);
  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "desc", "info_group", "sep", "btn_row", navId] },
        title: { type: "text", props: { content: "Token Actions", size: "lg", weight: "bold" } },
        desc: {
          type: "text",
          props: { content: "View USDC on Base in the Farcaster client.", size: "sm" },
        },
        info_group: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["token_item", "chain_item"],
        },
        token_item: {
          type: "item",
          props: { title: "USDC on Base" },
          children: ["token_badge"],
        },
        token_badge: { type: "badge", props: { label: "ERC-20", color: "amber" } },
        chain_item: {
          type: "item",
          props: { title: "Chain ID" },
          children: ["chain_badge"],
        },
        chain_badge: { type: "badge", props: { label: "8453" } },
        sep: { type: "separator", props: {} },
        btn_row: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["view_token_btn", "etherscan_btn"],
        },
        view_token_btn: {
          type: "button",
          props: { label: "View USDC", icon: "wallet" },
          on: { press: { action: "view_token", params: { token: USDC_BASE } } },
        },
        etherscan_btn: {
          type: "button",
          props: { label: "Etherscan", variant: "secondary", icon: "external-link" },
          on: {
            press: {
              action: "open_url",
              params: { target: "https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
            },
          },
        },
        ...navEls,
      },
    },
  };
}

function sendSwapPage(base: string): SnapHandlerResult {
  id = 0;
  const { id: navId, elements: navEls } = navRow(base);
  return {
    version: "1.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "desc", "info_group", "sep", "btn_row", navId] },
        title: { type: "text", props: { content: "Send & Swap", size: "lg", weight: "bold" } },
        desc: {
          type: "text",
          props: {
            content: `Send USDC to FID ${SEND_RECIPIENT_FID}, or swap USDC for cbETH on Base.`,
            size: "sm",
          },
        },
        info_group: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["send_item", "swap_item"],
        },
        send_item: {
          type: "item",
          props: { title: "Send to" },
          children: ["send_badge"],
        },
        send_badge: { type: "badge", props: { label: `FID ${SEND_RECIPIENT_FID}`, color: "teal" } },
        swap_item: {
          type: "item",
          props: { title: "Swap" },
          children: ["swap_badge"],
        },
        swap_badge: { type: "badge", props: { label: "USDC → cbETH", color: "blue" } },
        sep: { type: "separator", props: {} },
        btn_row: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["send_btn", "swap_btn"],
        },
        send_btn: {
          type: "button",
          props: { label: "Send USDC", icon: "coins" },
          on: {
            press: {
              action: "send_token",
              params: { token: USDC_BASE, recipientFid: SEND_RECIPIENT_FID },
            },
          },
        },
        swap_btn: {
          type: "button",
          props: { label: "Swap to cbETH", icon: "refresh-cw" },
          on: {
            press: {
              action: "swap_token",
              params: { sellToken: USDC_BASE, buyToken: CBETH_BASE },
            },
          },
        },
        ...navEls,
      },
    },
  };
}
