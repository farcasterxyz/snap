import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";

const app = new Hono();

registerSnapHandler(app, async () => {
  return {
    version: "1.0",
    page: {
      theme: { accent: "green" },
      button_layout: "stack",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Snap two",
          },
          {
            type: "text",
            style: "body",
            content:
              "You are viewing snap two. The words snap two are in the title and here so you always know which snap you are viewing.",
          },
          {
            type: "text",
            style: "body",
            content:
              "In the emulator, the Snap URL field updates when you follow a link: it now shows this snap's URL (snap two), not snap one's.",
          },
          {
            type: "text",
            style: "caption",
            content:
              "Green accent = snap two; blue = snap one. Button below returns to snap one.",
          },
        ],
      },
      buttons: [
        {
          label: "Back to snap one",
          action: "link",
          target: firstSnapTargetUrl(),
        },
      ],
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
