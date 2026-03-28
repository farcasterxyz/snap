import { Hono } from "hono";
import { handle } from "hono/vercel";
import { registerSnapHandler } from "@farcaster/snap-hono";

const app = new Hono();

registerSnapHandler(
  app,
  async () => {
    return {
      version: "1.0",
      page: {
        theme: { accent: "blue" },
        button_layout: "stack",
        elements: {
          type: "stack",
          children: [
            {
              type: "text",
              style: "title",
              content: "Snap one",
            },
            {
              type: "text",
              style: "body",
              content:
                "This is snap one. The words snap one appear in the title and here so you always know which snap you are viewing.",
            },
            {
              type: "text",
              style: "caption",
              content:
                "Snap one: two links below — grin.io (browser) and snap two (same emulator).",
            },
          ],
        },
        buttons: [
          {
            label: "Open grin.io",
            action: "link",
            target: "https://grin.io/",
          },
          {
            label: "Go to the second snap",
            action: "link",
            target: secondSnapTargetUrl(),
          },
        ],
      },
    };
  },
  {
    bypassSignatureVerification: bypassSignatureVerification(),
  },
);

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

function bypassSignatureVerification(): boolean {
  const v = process.env.BYPASS_SIGNATURE_VERIFICATION?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
