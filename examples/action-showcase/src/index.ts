import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";

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

const app = new Hono();

// Home page
registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  // Support POST navigation from button_group
  if (ctx.action.type === "post") {
    const selected = ctx.action.inputs[MENU_NAME];
    if (selected === OPT_CAST) return castPage(base);
    if (selected === OPT_PROFILE) return profilePage(base);
    if (selected === OPT_TOKEN) return tokenPage(base);
    if (selected === OPT_SEND) return sendSwapPage(base);
  }
  return homePage(base);
}, { path: "/" });

// Direct GET pages for each action category
registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  return castPage(base);
}, { path: "/cast" });

registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  return profilePage(base);
}, { path: "/profile" });

registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  return tokenPage(base);
}, { path: "/token" });

registerSnapHandler(app, async (ctx) => {
  const base = snapBaseUrl(ctx.request);
  return sendSwapPage(base);
}, { path: "/send-swap" });

export default app;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function homePage(base: string): any {
  return {
    version: "1.0",
    page: {
      theme: { accent: "purple" },
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Action Showcase" },
          {
            type: "text",
            style: "body",
            content:
              "Explore all snap action types: post, link, mini_app, and client actions. Pick a category below.",
          },
          {
            type: "button_group",
            name: MENU_NAME,
            options: [OPT_CAST, OPT_PROFILE, OPT_TOKEN, OPT_SEND],
          },
        ],
      },
      buttons: [
        { label: "Go", action: "post", target: `${base}/` },
        {
          label: "Open Mini App",
          action: "mini_app",
          target: MINI_APP_URL,
          style: "secondary",
        },
      ],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castPage(base: string): any {
  return {
    version: "1.0",
    page: {
      theme: { accent: "blue" },
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Cast Actions" },
          {
            type: "text",
            style: "body",
            content:
              "View a specific cast, or compose a new one with pre-filled text.",
          },
          {
            type: "text",
            style: "caption",
            content: `Cast: ${CAST_HASH.slice(0, 10)}...`,
          },
        ],
      },
      buttons: [
        {
          label: "View Cast",
          action: "client",
          client_action: { type: "view_cast", hash: CAST_HASH },
        },
        {
          label: "Compose Cast",
          action: "client",
          client_action: {
            type: "compose_cast",
            text: "Testing the Action Showcase snap!",
            channelKey: "farcaster",
          },
          style: "secondary",
        },
        {
          label: "Back",
          action: "post",
          target: `${base}/`,
          style: "secondary",
        },
      ],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function profilePage(base: string): any {
  return {
    version: "1.0",
    page: {
      theme: { accent: "green" },
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Profile Actions" },
          {
            type: "text",
            style: "body",
            content: `Open FID ${PROFILE_FID}'s profile in the Farcaster client, or visit a mini app.`,
          },
          {
            type: "text",
            style: "caption",
            content: "Uses client action view_profile and mini_app action.",
          },
        ],
      },
      buttons: [
        {
          label: "View Profile",
          action: "client",
          client_action: { type: "view_profile", fid: PROFILE_FID },
        },
        {
          label: "Open Mini App",
          action: "mini_app",
          target: MINI_APP_URL,
          style: "secondary",
        },
        {
          label: "Back",
          action: "post",
          target: `${base}/`,
          style: "secondary",
        },
      ],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tokenPage(base: string): any {
  return {
    version: "1.0",
    page: {
      theme: { accent: "amber" },
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Token Actions" },
          {
            type: "text",
            style: "body",
            content: "View USDC on Base in the Farcaster client.",
          },
          {
            type: "list",
            style: "plain",
            items: [
              { content: "USDC on Base", trailing: "ERC-20" },
              { content: "Chain ID", trailing: "8453" },
            ],
          },
        ],
      },
      buttons: [
        {
          label: "View USDC",
          action: "client",
          client_action: { type: "view_token", token: USDC_BASE },
        },
        {
          label: "Etherscan",
          action: "link",
          target:
            "https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          style: "secondary",
        },
        {
          label: "Back",
          action: "post",
          target: `${base}/`,
          style: "secondary",
        },
      ],
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendSwapPage(base: string): any {
  return {
    version: "1.0",
    page: {
      theme: { accent: "teal" },
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Send & Swap" },
          {
            type: "text",
            style: "body",
            content: `Send USDC to FID ${SEND_RECIPIENT_FID}, or swap USDC for cbETH on Base.`,
          },
          {
            type: "list",
            style: "plain",
            items: [
              { content: "Send to", trailing: `FID ${SEND_RECIPIENT_FID}` },
              { content: "Swap", trailing: "USDC → cbETH" },
            ],
          },
        ],
      },
      button_layout: "grid",
      buttons: [
        {
          label: "Send USDC",
          action: "client",
          client_action: {
            type: "send_token",
            token: USDC_BASE,
            recipientFid: SEND_RECIPIENT_FID,
          },
        },
        {
          label: "Swap to cbETH",
          action: "client",
          client_action: {
            type: "swap_token",
            sellToken: USDC_BASE,
            buyToken: CBETH_BASE,
          },
        },
        {
          label: "Back",
          action: "post",
          target: `${base}/`,
          style: "secondary",
        },
      ],
    },
  };
}
