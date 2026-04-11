import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import { verifyJFSRequestBody } from "@farcaster/snap";
import type { SnapHandlerResult } from "@farcaster/snap";

/** In-memory per-FID counter store.
 * Replace with a real DB (Postgres, Supabase, etc.) in production.
 */
const counts = new Map<number, number>();

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  if (ctx.action.type === "post") {
    // 1. Verify the POST is genuinely signed by the Farcaster user
    const verified = await verifyJFSRequestBody(ctx.request);
    if (!verified) {
      return {
        version: "2.0",
        ui: {
          root: "page",
          elements: {
            page: { type: "stack", props: {}, children: ["err-title", "err-body"] },
            "err-title": { type: "item", props: { title: "Authentication Failed" } },
            "err-body": { type: "item", props: { description: "Signature verification failed." } },
          },
        },
      };
    }

    // 2. Signature verified — safely use the FID
    const fid = ctx.action.user.fid;
    counts.set(fid, (counts.get(fid) ?? 0) + 1);
  }

  const fid = ctx.action.user.fid;
  const count = counts.get(fid) ?? 0;

  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title", "display", "btn"] },
        title: { type: "item", props: { title: "Authenticated Counter" } },
        display: {
          type: "item",
          props: { description: `FID ${fid} — clicked ${count} time${count === 1 ? "" : "s"}.` },
        },
        btn: {
          type: "button",
          props: { label: "Increment (+1)" },
          on: { click: { action: "post" } },
        },
      },
    },
  };
});

export default app;
