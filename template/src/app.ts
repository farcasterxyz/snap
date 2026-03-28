import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapResponse } from "@farcaster/snap";

const BUTTON_GROUP_NAME = "action" as const;
const OPT_INCREMENT = "Increment" as const;
const OPT_RESET = "Reset" as const;

const clickCountByFid = new Map<number, number>();

const app = new Hono();

registerSnapHandler(app, async ({ action, request }) => {
  const snapBaseUrl = snapBaseUrlFromRequest(request);

  if (action.type === "get") {
    return snapRoot(
      0,
      snapBaseUrl,
      "State is keyed by fid. Press Increment or Reset, then Submit.",
    );
  }

  const current = clickCountByFid.get(action.fid) ?? 0;
  const rawChoice = action.inputs[BUTTON_GROUP_NAME];
  const choice = typeof rawChoice === "string" ? rawChoice : undefined;

  let next = current;
  if (choice === OPT_RESET) next = 0;
  else if (choice === OPT_INCREMENT) next = current + 1;
  clickCountByFid.set(action.fid, next);

  const caption =
    choice === undefined
      ? "No action selected. Pick Increment or Reset, then Submit."
      : `Applied: ${choice}`;

  return snapRoot(next, snapBaseUrl, caption);
});

export default app;

function snapRoot(
  count: number,
  snapBaseUrl: string,
  caption: string,
): SnapResponse {
  return {
    version: "1.0",
    page: {
      theme: { accent: "teal" },
      button_layout: "stack",
      elements: {
        type: "stack",
        children: [
          { type: "text", style: "title", content: "Template snap" },
          {
            type: "text",
            style: "body",
            content: `Count: ${count}. Pick an action, then press Submit.`,
          },
          {
            type: "button_group",
            name: BUTTON_GROUP_NAME,
            options: [OPT_INCREMENT, OPT_RESET],
            style: "row",
          },
          { type: "text", style: "caption", content: caption },
        ],
      },
      buttons: [{ label: "Submit", action: "post", target: `${snapBaseUrl}/` }],
    },
  };
}

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "http";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();

  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return "http://localhost:3003";
}
