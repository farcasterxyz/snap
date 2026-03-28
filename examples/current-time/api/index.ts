import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";

const BUTTON_GROUP_NAME = "display" as const;
const OPT_ISO = "ISO (UTC)";
const OPT_LOCAL = "Local";

const app = new Hono();

registerSnapHandler(app, async ({ action }) => {
  const pref =
    action.type === "post" &&
    typeof action.inputs[BUTTON_GROUP_NAME] === "string"
      ? (action.inputs[BUTTON_GROUP_NAME] as string)
      : undefined;
  const body = timeBody(pref);
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
          target: `${snapBaseUrl()}/`,
        },
      ],
    },
  };
});

export default app;

export const runtime = "edge";
export const GET = handle(app);
export const POST = handle(app);

function snapBaseUrl(): string {
  const raw =
    process.env.SNAP_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.PORT ?? "3014"}`;
  return raw.replace(/\/$/, "");
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
