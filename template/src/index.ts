import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";

const BUTTON_GROUP_NAME = "topic" as const;
const OPT_OVERVIEW = "Overview";
const OPT_HTTP = "HTTP";
const OPT_LOCAL = "Local";
const OPT_DEPLOY = "Deploy";

const __dir = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dir, "../assets/fonts");

const app = new Hono();

registerSnapHandler(
  app,
  async (ctx) => {
    const pref =
      ctx.action.type === "post" &&
      typeof ctx.action.inputs[BUTTON_GROUP_NAME] === "string"
        ? (ctx.action.inputs[BUTTON_GROUP_NAME] as string)
        : undefined;
    const body = onboardingBody(pref);
    const caption = onboardingCaption(pref, ctx.action.type === "post");
    const base = snapBaseUrlFromRequest(ctx.request);
    return {
      version: "1.0",
      page: {
        theme: { accent: "purple" },
        button_layout: "stack",
        elements: {
          type: "stack" as const,
          children: [
            { type: "text", style: "title", content: "Snap starter" },
            { type: "text", style: "body", content: body },
            {
              type: "button_group",
              name: BUTTON_GROUP_NAME,
              options: [OPT_OVERVIEW, OPT_HTTP, OPT_LOCAL, OPT_DEPLOY],
              style: "row",
            },
            { type: "text", style: "caption", content: caption },
          ],
        },
        buttons: [
          {
            label: "Refresh",
            action: "post",
            target: `${base}/`,
          },
        ],
      },
    };
  },
  {
    og: {
      fonts: [
        { path: join(fontsDir, "inter-latin-400-normal.woff"), weight: 400 },
        { path: join(fontsDir, "inter-latin-700-normal.woff"), weight: 700 },
      ],
    },
  },
);

export default app;

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const host = (forwardedHost ?? hostHeader)
    ?.split(",")[0]
    .trim();
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

  return `http://localhost:${process.env.PORT ?? "3003"}`.replace(/\/$/, "");
}

function onboardingBody(pref: string | undefined): string {
  switch (pref) {
    case OPT_HTTP:
      return clampBody(
        "GET with Accept: application/vnd.farcaster.snap+json. POSTs send a JFS-shaped body; return the next page from your handler.",
      );
    case OPT_LOCAL:
      return clampBody(
        "Run pnpm dev. Point the Farcaster snap emulator at this URL. SKIP_JFS_VERIFICATION skips signature checks when NODE_ENV is not production.",
      );
    case OPT_DEPLOY:
      return clampBody(
        "Set SNAP_PUBLIC_BASE_URL to your public HTTPS origin (no trailing slash) so post targets match what clients call. Ship as Hono on Vercel.",
      );
    case OPT_OVERVIEW:
      return clampBody(
        "Snaps are feed cards driven by your JSON. registerSnapHandler validates requests and runs your callback to build each SnapResponse.",
      );
    default:
      return clampBody(
        "Pick a topic, tap Refresh. Replace this file with your own pages, buttons, and POST handling.",
      );
  }
}

function onboardingCaption(pref: string | undefined, isPost: boolean): string {
  if (isPost && pref === undefined) {
    return clampCaption("Choose a topic, then Refresh.");
  }
  return clampCaption(
    "Clone template → edit src/index.ts → validate with the emulator.",
  );
}

function clampBody(s: string): string {
  return s.length <= 160 ? s : s.slice(0, 157) + "...";
}

function clampCaption(s: string): string {
  return s.length <= 100 ? s : s.slice(0, 97) + "...";
}
