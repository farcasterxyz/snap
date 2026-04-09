import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const TOGGLE_GROUP_NAME = "display" as const;
const OPT_ISO = "ISO (UTC)";
const OPT_LOCAL = "Local";

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  const pref =
    ctx.action.type === "post" &&
    typeof ctx.action.inputs[TOGGLE_GROUP_NAME] === "string"
      ? (ctx.action.inputs[TOGGLE_GROUP_NAME] as string)
      : undefined;
  const body = timeBody(pref);
  const base = snapBaseUrlFromRequest(ctx.request);
  return {
    version: "1.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "time-display", "format-picker", "caption", "btn-refresh"],
        },
        title: {
          type: "item",
          props: { title: "Server time" },
        },
        "time-display": {
          type: "item",
          props: { description: body },
        },
        "format-picker": {
          type: "toggle_group",
          props: { name: TOGGLE_GROUP_NAME, options: [{ value: "iso_utc", label: OPT_ISO }, { value: "local", label: OPT_LOCAL }] },
        },
        caption: {
          type: "badge",
          props: {
            label: "Choose format, then refresh",
          },
        },
        "btn-refresh": {
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
});

export default app;

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3014"}`.replace(/\/$/, "");
}

function timeBody(pref: string | undefined): string {
  const now = new Date();
  if (pref === "local") {
    const s = now.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    });
    return s.length <= 160 ? s : s.slice(0, 157) + "...";
  }
  return now.toISOString();
}
