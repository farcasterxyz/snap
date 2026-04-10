import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { SPEC_VERSION, type SnapFunction } from "@farcaster/snap";
import { registerSnapHandler } from "@farcaster/snap-hono";
import {
  createInMemoryDataStore,
  createTursoDataStore,
} from "@farcaster/snap-turso";

const TOPIC_NAME = "topic" as const;
const OPT_OVERVIEW = "overview";
const OPT_HTTP = "http";
const OPT_LOCAL = "local";
const OPT_DEPLOY = "deploy";

const data =
  process.env.VERCEL === "1"
    ? createTursoDataStore()
    : createInMemoryDataStore();

const snap: SnapFunction = async (ctx) => {
  const pref =
    ctx.action.type === "post" &&
    typeof ctx.action.inputs[TOPIC_NAME] === "string"
      ? (ctx.action.inputs[TOPIC_NAME] as string)
      : undefined;
  const body = onboardingBody(pref);
  const caption = onboardingCaption(pref, ctx.action.type === "post");
  const base = snapBaseUrlFromRequest(ctx.request);
  return {
    version: SPEC_VERSION,
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["header", "topics", "caption", "refresh"],
        },
        header: {
          type: "item",
          props: { title: "Snap starter", description: body },
        },
        topics: {
          type: "toggle_group",
          props: {
            name: TOPIC_NAME,
            options: [OPT_OVERVIEW, OPT_HTTP, OPT_LOCAL, OPT_DEPLOY],
          },
        },
        caption: {
          type: "badge",
          props: { label: caption },
        },
        refresh: {
          type: "button",
          props: { label: "Refresh" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
      },
    },
  };
};

const __dir = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dir, "../assets/fonts");

const app = new Hono();

registerSnapHandler(app, snap, {
  og: {
    fonts: [
      { path: join(fontsDir, "inter-latin-400-normal.woff"), weight: 400 },
      { path: join(fontsDir, "inter-latin-700-normal.woff"), weight: 700 },
    ],
  },
});

export default app;

function snapBaseUrlFromRequest(request: Request): string {
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

  return `http://localhost:${process.env.PORT ?? "3003"}`.replace(/\/$/, "");
}

function onboardingBody(pref: string | undefined): string {
  switch (pref) {
    case OPT_HTTP:
      return clamp(
        "GET with Accept: application/vnd.farcaster.snap+json. POSTs send a JFS-shaped body; return the next page from your handler.",
        160,
      );
    case OPT_LOCAL:
      return clamp(
        "Run pnpm dev. Point the Farcaster snap emulator at this URL. SKIP_JFS_VERIFICATION skips signature checks when NODE_ENV is not production.",
        160,
      );
    case OPT_DEPLOY:
      return clamp(
        "Set SNAP_PUBLIC_BASE_URL to your public HTTPS origin (no trailing slash) so post targets match what clients call. Ship as Hono on Vercel.",
        160,
      );
    case OPT_OVERVIEW:
      return clamp(
        "Snaps are feed cards driven by your JSON. registerSnapHandler validates requests and runs your callback to build each SnapResponse.",
        160,
      );
    default:
      return clamp(
        "Pick a topic, tap Refresh. Replace this file with your own pages, buttons, and POST handling.",
        160,
      );
  }
}

function onboardingCaption(pref: string | undefined, isPost: boolean): string {
  if (isPost && pref === undefined) {
    return clamp("Choose a topic, then Refresh.", 30);
  }
  return clamp("Clone → edit → validate.", 30);
}

function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + "...";
}
