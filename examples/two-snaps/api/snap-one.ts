import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (): Promise<SnapHandlerResult> => {
  return {
    version: "1.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "body", "caption", "btn-grin", "btn-snap-two"],
        },
        title: {
          type: "item",
          props: { title: "Snap one" },
        },
        body: {
          type: "item",
          props: {
            description:
              "This is snap one. The words snap one appear in the title and here so you always know which snap you are viewing.",
          },
        },
        caption: {
          type: "badge",
          props: {
            label: "Snap one: two links below",
          },
        },
        "btn-grin": {
          type: "button",
          props: { label: "Open grin.io" },
          on: {
            press: {
              action: "open_url",
              params: { target: "https://grin.io/" },
            },
          },
        },
        "btn-snap-two": {
          type: "button",
          props: { label: "Go to the second snap" },
          on: {
            press: {
              action: "open_url",
              params: { target: secondSnapTargetUrl() },
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

function secondSnapTargetUrl(): string {
  const raw =
    process.env.SNAP_TWO_PUBLIC_BASE_URL ??
    `http://localhost:${process.env.SNAP_TWO_PORT ?? "3017"}`;
  return `${raw.replace(/\/$/, "")}/`;
}
