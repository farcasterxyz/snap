import { POST_GRID_TAP_KEY } from "@farcaster/snap";
import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapAction, SnapResponse } from "@farcaster/snap";

function gridTapFromPostAction(action: SnapAction): {
  row: number;
  col: number;
} | null {
  if (action.type !== "post") return null;
  const raw = action.inputs[POST_GRID_TAP_KEY];
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { row?: unknown; col?: unknown };
  const row = Number(o.row);
  const col = Number(o.col);
  if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
  return { row, col };
}

/**
 * Full catalog for web + native emulators. Paginated with POST **Next page** because the
 * spec caps root children (5), allows only one of `image` \| `grid` per page, and applies
 * a height budget (~500px). More pages = less clutter per screen; everything is still
 * covered across the sequence.
 */
const TOTAL_PAGES = 8;

const BUTTON_GROUP_NAME = "catalog_button_choice" as const;
const TOGGLE_NAME = "catalog_toggle_flag" as const;
const TEXT_INPUT_NAME = "catalog_text_input" as const;
const SLIDER_NAME = "catalog_slider_value" as const;

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.trim() ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT ?? "3015"}`.replace(/\/$/, "");
}

function pageIndexFromQuery(raw: string | null): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return n;
}

/** Fixed-id Picsum photo — HTTPS + `.jpg` (required by snap image URL validation). */
const IMAGE_URL = "https://picsum.photos/id/237/600/600.jpg";

/** Walls only — cells omitted here are tappable when `interactive` is true (see spec). */
function catalogInteractiveGridCells(): Array<{
  row: number;
  col: number;
  color: string;
  content?: string;
}> {
  const rows = 6;
  const cols = 6;
  const edge = "#1f2937";
  const inner = "#475569";
  const out: Array<{ row: number; col: number; color: string; content?: string }> = [];

  for (let c = 0; c < cols; c++) {
    out.push({ row: 0, col: c, color: edge });
    out.push({ row: rows - 1, col: c, color: edge });
  }
  for (let r = 1; r < rows - 1; r++) {
    out.push({ row: r, col: 0, color: edge });
    out.push({ row: r, col: cols - 1, color: edge });
  }

  out.push(
    { row: 2, col: 2, color: inner, content: "★" },
    { row: 2, col: 3, color: inner, content: "★" },
    { row: 3, col: 2, color: inner, content: "★" },
    { row: 3, col: 3, color: inner, content: "★" },
  );
  out.push({ row: 1, col: 2, color: inner });
  out.push({ row: 1, col: 3, color: inner });
  out.push({ row: 4, col: 2, color: inner });
  out.push({ row: 4, col: 3, color: inner });

  return out;
}

function buildSnapRoot(
  pageIndex: number,
  snapBaseUrl: string,
  lastPostGridTap: { row: number; col: number } | null,
): SnapResponse {
  const idx = ((pageIndex % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
  const nextPage = (idx + 1) % TOTAL_PAGES;

  const sharedTheme = { accent: "amber" } as const;
  const nextButton = {
    label: "Next page",
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
            content: `Catalog · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "text" as const,
            style: "body" as const,
            content: "Tap Next page to walk every catalog element.",
          },
        ];
      case 1:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Button group & toggle · ${idx + 1}/${TOTAL_PAGES}`,
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
            label: "Toggle",
            value: false,
          },
        ];
      case 2:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Inputs · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "text_input" as const,
            name: TEXT_INPUT_NAME,
            placeholder: "Text input",
            maxLength: 80,
          },
          {
            type: "slider" as const,
            name: SLIDER_NAME,
            min: 0,
            max: 100,
            step: 10,
            value: 50,
            label: "Slider",
          },
          {
            type: "progress" as const,
            value: 30,
            max: 100,
            label: "Progress",
            color: "green" as const,
          },
        ];
      case 3:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Image · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "text" as const,
            style: "label" as const,
            content: "HTTPS URL · 1:1 aspect",
          },
          {
            type: "image" as const,
            url: IMAGE_URL,
            aspect: "1:1" as const,
            alt: "Brown dog on a bench (Picsum id 237)",
          },
        ];
      case 4:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Grid · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "text" as const,
            style: "body" as const,
            content:
              "Tap opens a square (accent border) and sets inputs.grid_tap locally only. The server sees grid_tap when you POST (e.g. Next page). Walls = cells listed in JSON.",
          },
          {
            type: "grid" as const,
            cols: 6,
            rows: 6,
            cellSize: "auto" as const,
            gap: "medium" as const,
            interactive: true,
            cells: catalogInteractiveGridCells(),
          },
        ];
      case 5:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Row group & lists · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "text" as const,
            style: "body" as const,
            content:
              (lastPostGridTap != null
                ? `Last POST carried inputs.grid_tap row ${lastPostGridTap.row}, col ${lastPostGridTap.col}. `
                : "") +
              "Group = one element, horizontal row of 2–3 small tiles (not for lists). Lists are normal stack elements below.",
          },
          {
            type: "group" as const,
            layout: "row" as const,
            children: [
              {
                type: "text" as const,
                style: "title" as const,
                content: "42",
                align: "center" as const,
              },
              {
                type: "text" as const,
                style: "caption" as const,
                content: "Score",
                align: "center" as const,
              },
              {
                type: "text" as const,
                style: "caption" as const,
                content: "Today",
                align: "center" as const,
              },
            ],
          },
          {
            type: "list" as const,
            style: "unordered" as const,
            items: [
              { content: "Unordered", trailing: "•" },
              { content: "With trailing", trailing: "1" },
              { content: "Third row", trailing: "2" },
            ],
          },
          {
            type: "list" as const,
            style: "ordered" as const,
            items: [
              { content: "Ordered", trailing: "a" },
              { content: "Second", trailing: "b" },
            ],
          },
        ];
      case 6:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Divider & spacer · ${idx + 1}/${TOTAL_PAGES}`,
          },
          { type: "divider" as const },
          { type: "spacer" as const, size: "small" as const },
          {
            type: "text" as const,
            style: "caption" as const,
            content: "Caption after spacer",
          },
        ];
      case 7:
        return [
          {
            type: "text" as const,
            style: "title" as const,
            content: `Bar chart · ${idx + 1}/${TOTAL_PAGES}`,
          },
          {
            type: "bar_chart" as const,
            color: "accent" as const,
            max: 40,
            bars: [
              { label: "A", value: 10, color: "teal" as const },
              { label: "B", value: 24 },
              { label: "C", value: 18, color: "purple" as const },
            ],
          },
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

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const pageIndex = pageIndexFromQuery(url.searchParams.get("page"));
  const snapBaseUrl = snapBaseUrlFromRequest(ctx.request);
  return buildSnapRoot(
    pageIndex,
    snapBaseUrl,
    gridTapFromPostAction(ctx.action),
  );
});

export default app;
