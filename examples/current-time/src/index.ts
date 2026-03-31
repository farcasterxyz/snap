import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";

const BUTTON_GROUP_NAME = "display" as const;
const OPT_ISO = "ISO (UTC)";
const OPT_LOCAL = "Local";

const app = new Hono();

registerSnapHandler(app, async ({ action, request }) => {
  const pref =
    action.type === "post" &&
    typeof action.inputs[BUTTON_GROUP_NAME] === "string"
      ? (action.inputs[BUTTON_GROUP_NAME] as string)
      : undefined;
  const body = timeBody(pref);
  const base = snapBaseUrlFromRequest(request);
  return {
    version: "1.0",
    page: {
      theme: { accent: "blue" },
      button_layout: "stack",
      elements: {
        type: "stack" as const,
        children: [
          { type: "text", style: "title", content: "Server time" },
          { type: "text", style: "body", content: body },
          {
            type: "button_group",
            name: BUTTON_GROUP_NAME,
            options: [OPT_ISO, OPT_LOCAL],
            style: "row",
          },
          {
            type: "text",
            style: "caption",
            content:
              "Choose format, then refresh. Time is from this server when it responds.",
          },
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
  if (pref === OPT_LOCAL) {
    const s = now.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    });
    return s.length <= 160 ? s : s.slice(0, 157) + "...";
  }
  return now.toISOString();
}
