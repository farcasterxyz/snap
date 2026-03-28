import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapResponse } from "@farcaster/snap";

const TOTAL_PAGES = 5;

const BUTTON_GROUP_NAME = "catalog_button_choice" as const;
const TOGGLE_NAME = "catalog_toggle_flag" as const;
const TEXT_INPUT_NAME = "catalog_text_input" as const;
const SLIDER_NAME = "catalog_slider_value" as const;

const OPT_TITLE = "UI catalog elements";

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3015"}`.replace(/\/$/, "");
}

function bypassSignatureVerification(): boolean {
  const v = process.env.BYPASS_SIGNATURE_VERIFICATION?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function pageIndexFromQuery(raw: string | null): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return n;
}

const IMAGE_URL =
  "https://placehold.co/300x300.png?text=UI+catalog+image+(.png)";
const VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function buildSnapRoot(pageIndex: number, snapBaseUrl: string): SnapResponse {
  const idx = ((pageIndex % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
  const nextPage = (idx + 1) % TOTAL_PAGES;

  const sharedTheme = { accent: "amber" } as const;
  const nextButton = {
    label: "Next",
    action: "post" as const,
    target: `${snapBaseUrl}/?page=${nextPage}`,
  };

  const rootChildren = (() => {
    switch (idx) {
      case 0:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: OPT_TITLE,
          },
          {
            type: "text" as const,
            style: "body" as const,
            content: "Page 1/5: Text, ButtonGroup, Toggle, Spacer",
          },
          {
            type: "button_group" as const,
            name: BUTTON_GROUP_NAME,
            options: ["Alpha", "Bravo", "Charlie"],
            style: "row" as const,
          },
          {
            type: "toggle" as const,
            name: TOGGLE_NAME,
            label: "Example toggle",
            value: false,
          },
          { type: "spacer" as const, size: "medium" as const },
        ];
      case 1:
        return [
          { type: "divider" as const },
          {
            type: "progress" as const,
            value: 30,
            max: 100,
            label: "Progress 30%",
            color: "green" as const,
          },
          {
            type: "list" as const,
            style: "unordered" as const,
            items: [
              { content: "List item A", trailing: "1" },
              { content: "List item B", trailing: "2" },
              { content: "List item C", trailing: "3" },
            ],
          },
          {
            type: "text_input" as const,
            name: TEXT_INPUT_NAME,
            placeholder: "Type something…",
            maxLength: 80,
          },
          {
            type: "slider" as const,
            name: SLIDER_NAME,
            min: 0,
            max: 100,
            step: 10,
            value: 50,
            label: "Slider value",
          },
        ];
      case 2:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: "Image + Group",
          },
          {
            type: "image" as const,
            url: IMAGE_URL,
            aspect: "1:1" as const,
            alt: "UI catalog image",
          },
          {
            type: "group" as const,
            layout: "row" as const,
            children: [
              {
                type: "text" as const,
                style: "caption" as const,
                content: "Group wrapper",
                align: "center" as const,
              },
              {
                type: "progress" as const,
                value: 40,
                max: 100,
                label: "Grouped progress",
                color: "orange" as const,
              },
              {
                type: "list" as const,
                style: "plain" as const,
                items: [
                  { content: "G1" },
                  { content: "G2" },
                  { content: "G3" },
                ],
              },
            ],
          },
          { type: "divider" as const },
        ];
      case 3:
        return [
          { type: "text" as const, style: "title" as const, content: "Video" },
          {
            type: "video" as const,
            url: VIDEO_URL,
            aspect: "16:9" as const,
            alt: "UI catalog video",
          },
          { type: "spacer" as const, size: "small" as const },
          { type: "divider" as const },
        ];
      case 4:
        return [
          { type: "text" as const, style: "title" as const, content: "Grid" },
          {
            type: "grid" as const,
            cols: 3,
            rows: 2,
            cellSize: "square" as const,
            gap: "small" as const,
            interactive: false,
            cells: [
              { row: 0, col: 0, color: "#8b5cf6", content: "A1" },
              { row: 0, col: 1, color: "#22c55e", content: "A2" },
              { row: 0, col: 2, color: "#3b82f6", content: "A3" },
              { row: 1, col: 0, color: "#f97316", content: "B1" },
              { row: 1, col: 1, color: "#ef4444", content: "B2" },
              { row: 1, col: 2, color: "#a78bfa", content: "B3" },
            ],
          },
          { type: "divider" as const },
        ];
      default:
        return [
          {
            type: "text" as const,
            style: "body" as const,
            content: "Unknown page",
          },
        ];
    }
  })();

  return {
    version: "1.0",
    page: {
      theme: sharedTheme,
      button_layout: "stack",
      elements: {
        type: "stack" as const,
        children:
          rootChildren as unknown as SnapResponse["page"]["elements"]["children"],
      },
      buttons: [nextButton],
    },
  };
}

const app = new Hono();

registerSnapHandler(
  app,
  async ({ request }) => {
    const url = new URL(request.url);
    const pageIndex = pageIndexFromQuery(url.searchParams.get("page"));
    const snapBaseUrl = snapBaseUrlFromRequest(request);
    return buildSnapRoot(pageIndex, snapBaseUrl);
  },
  {
    bypassSignatureVerification: bypassSignatureVerification(),
  },
);

export default app;
