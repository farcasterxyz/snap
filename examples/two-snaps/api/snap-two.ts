import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (): Promise<SnapHandlerResult> => {
  return {
    version: "1.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "body1", "body2", "caption", "btn-snap-one"],
        },
        title: {
          type: "item",
          props: { title: "Snap two" },
        },
        body1: {
          type: "item",
          props: {
            description:
              "You are viewing snap two. The words snap two are in the title and here so you always know which snap you are viewing.",
          },
        },
        body2: {
          type: "item",
          props: {
            description:
              "In the emulator, the Snap URL field updates when you follow a link: it now shows this snap's URL (snap two), not snap one's.",
          },
        },
        caption: {
          type: "badge",
          props: {
            label: "Green = snap two, blue = one",
          },
        },
        "btn-snap-one": {
          type: "button",
          props: { label: "Back to snap one" },
          on: {
            press: {
              action: "open_url",
              params: { target: firstSnapTargetUrl() },
            },
          },
        },
      },
    },
  };
});

export default app;

export const runtime = "edge";
export const GET = handle(app);
export const POST = handle(app);

function firstSnapTargetUrl(): string {
  const raw =
    process.env.SNAP_ONE_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.SNAP_ONE_PORT ?? "3016"}`;
  return `${raw.replace(/\/$/, "")}/`;
}
