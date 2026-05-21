import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  return componentImprovementsPage(snapBaseUrlFromRequest(ctx.request));
});

export default app;

function componentImprovementsPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: { gap: "sm" },
          children: ["banner", "pager", "actions"],
        },
        banner: {
          type: "image",
          props: {
            url: "https://placehold.co/1200x300/0f766e/ffffff.png?text=Snap+Banner",
            aspect: "4:1",
            alt: "Teal banner",
            title: "Component improvements",
            subtitle: "4:1 image overlay, local paginator, compact layout",
          },
        },
        pager: {
          type: "paginator",
          props: { initialPage: 0 },
          children: [
            "page-one",
            "page-two",
            "page-three",
            "page-four",
            "page-five",
            "page-six",
            "page-seven",
            "page-eight",
          ],
        },
        "page-one": step("Step 1"),
        "page-two": step("Step 2"),
        "page-three": gridStep(),
        "page-four": step("Step 4"),
        "page-five": step("Step 5"),
        "page-six": step("Step 6"),
        "page-seven": step("Step 7"),
        "page-eight": step("Step 8"),
        actions: {
          type: "stack",
          props: { direction: "horizontal", equalWidth: true },
          children: ["primary", "secondary"],
        },
        primary: {
          type: "button",
          props: { label: "Looks good", variant: "primary" },
          on: { press: { action: "submit", params: { target: `${base}/` } } },
        },
        secondary: {
          type: "button",
          props: { label: "Refresh" },
          on: { press: { action: "submit", params: { target: `${base}/` } } },
        },
        ...extraElements,
      },
    },
  };
}

function step(title: string) {
  return {
    type: "stack",
    props: { gap: "sm" },
    children: [`${title}-title`, `${title}-copy`],
  };
}

function gridStep() {
  return {
    type: "stack",
    props: { gap: "sm" },
    children: ["grid-title", "grid"],
  };
}

const extraElements = {
  "Step 1-title": {
    type: "text",
    props: { content: "Paginator page", weight: "bold" },
  },
  "Step 1-copy": {
    type: "text",
    props: {
      content: "One visible line by default keeps the card short.",
      size: "sm",
    },
  },
  "Step 2-title": {
    type: "text",
    props: { content: "Intentional wrapping", weight: "bold" },
  },
  "Step 2-copy": {
    type: "text",
    props: {
      content:
        "This page opts into two lines with maxLines so explanatory text can breathe without making every snap tall.",
      size: "sm",
      maxLines: 2,
    },
  },
  "grid-title": {
    type: "text",
    props: { content: "Dense square grid", weight: "bold" },
  },
  grid: {
    type: "cell_grid",
    props: {
      cols: 6,
      rows: 3,
      cellAspectRatio: "square",
      cells: Array.from({ length: 18 }, (_, index) => ({
        row: Math.floor(index / 6),
        col: index % 6,
        color: index % 2 === 0 ? "teal" : "#99f6e4",
      })),
    },
  },
  "Step 4-title": {
    type: "text",
    props: { content: "Local state", weight: "bold" },
  },
  "Step 4-copy": {
    type: "text",
    props: { content: "Paginator controls do not POST or mutate inputs.", size: "sm" },
  },
  "Step 5-title": {
    type: "text",
    props: { content: "Image overlay", weight: "bold" },
  },
  "Step 5-copy": {
    type: "text",
    props: { content: "Use image title/subtitle instead of a hero component.", size: "sm" },
  },
  "Step 6-title": {
    type: "text",
    props: { content: "More than six pages", weight: "bold" },
  },
  "Step 6-copy": {
    type: "text",
    props: { content: "The child count can exceed normal stack limits.", size: "sm" },
  },
  "Step 7-title": {
    type: "text",
    props: { content: "Global caps remain", weight: "bold" },
  },
  "Step 7-copy": {
    type: "text",
    props: { content: "The global 64-element cap still applies.", size: "sm" },
  },
  "Step 8-title": {
    type: "text",
    props: { content: "Compact first", weight: "bold" },
  },
  "Step 8-copy": {
    type: "text",
    props: { content: "Use compact gaps before reaching for more UI.", size: "sm" },
  },
} as const;

if (import.meta.url === `file://${process.argv[1]}`) {
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3024) });
  console.log(`component-improvements running on http://localhost:${process.env.PORT ?? "3024"}`);
}

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "http";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3024"}`;
}
