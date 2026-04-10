import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const TOTAL_PAGES = 5;

const TOGGLE_GROUP_NAME = "catalog_toggle_choice" as const;
const TOGGLE_NAME = "catalog_toggle_flag" as const;
const TEXT_INPUT_NAME = "catalog_text_input" as const;
const SLIDER_NAME = "catalog_slider_value" as const;

const IMAGE_URL =
  "https://placehold.co/300x300.png?text=UI+catalog+image+(.png)";

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

function pageIndexFromQuery(raw: string | null): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function buildSnapRoot(
  pageIndex: number,
  snapBaseUrl: string,
): SnapHandlerResult {
  const idx = ((pageIndex % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
  const nextPage = (idx + 1) % TOTAL_PAGES;

  const sharedTheme = { accent: "amber" } as const;

  const elements: Record<string, unknown> = {};

  switch (idx) {
    case 0: {
      elements.page = {
        type: "stack",
        props: {},
        children: ["title", "subtitle", "btn-group", "toggle", "btn-next"],
      };
      elements.title = {
        type: "item",
        props: { title: "UI catalog elements" },
      };
      elements.subtitle = {
        type: "item",
        props: { description: "Page 1/5: Text, ToggleGroup, Toggle" },
      };
      elements["btn-group"] = {
        type: "toggle_group",
        props: {
          name: TOGGLE_GROUP_NAME,
          options: [{ value: "alpha", label: "Alpha" }, { value: "bravo", label: "Bravo" }, { value: "charlie", label: "Charlie" }],
        },
      };
      elements.toggle = {
        type: "switch",
        props: { name: TOGGLE_NAME, label: "Example toggle" },
      };
      break;
    }
    case 1: {
      elements.page = {
        type: "stack",
        props: {},
        children: [
          "sep1",
          "progress",
          "item-a",
          "item-b",
          "item-c",
          "text-input",
          "slider",
          "btn-next",
        ],
      };
      elements.sep1 = { type: "separator", props: {} };
      elements.progress = {
        type: "progress",
        props: { value: 30, max: 100, label: "Progress 30%" },
      };
      elements["item-a"] = {
        type: "item",
        props: { title: "List item A", description: "1" },
      };
      elements["item-b"] = {
        type: "item",
        props: { title: "List item B", description: "2" },
      };
      elements["item-c"] = {
        type: "item",
        props: { title: "List item C", description: "3" },
      };
      elements["text-input"] = {
        type: "input",
        props: {
          name: TEXT_INPUT_NAME,
          placeholder: "Type something…",
          maxLength: 80,
        },
      };
      elements.slider = {
        type: "slider",
        props: {
          name: SLIDER_NAME,
          min: 0,
          max: 100,
          step: 10,
          value: 50,
          label: "Slider value",
        },
      };
      break;
    }
    case 2: {
      elements.page = {
        type: "stack",
        props: {},
        children: [
          "title",
          "catalog-image",
          "group-row",
          "sep1",
          "btn-next",
        ],
      };
      elements.title = {
        type: "item",
        props: { title: "Image + Group" },
      };
      elements["catalog-image"] = {
        type: "image",
        props: { url: IMAGE_URL, aspect: "1:1" },
      };
      elements["group-row"] = {
        type: "stack",
        props: { direction: "horizontal" },
        children: ["group-badge", "group-progress", "group-item"],
      };
      elements["group-badge"] = {
        type: "badge",
        props: { label: "Group wrapper" },
      };
      elements["group-progress"] = {
        type: "progress",
        props: { value: 40, max: 100, label: "Grouped progress" },
      };
      elements["group-item"] = {
        type: "item",
        props: { title: "G1 · G2 · G3" },
      };
      elements.sep1 = { type: "separator", props: {} };
      break;
    }
    case 3: {
      elements.page = {
        type: "stack",
        props: {},
        children: [
          "title",
          "completion",
          "step-1",
          "step-2",
          "sep1",
          "btn-next",
        ],
      };
      elements.title = {
        type: "item",
        props: { title: "Progress + List" },
      };
      elements.completion = {
        type: "progress",
        props: { value: 72, max: 100, label: "Completion" },
      };
      elements["step-1"] = {
        type: "item",
        props: { title: "First step", description: "done" },
      };
      elements["step-2"] = {
        type: "item",
        props: { title: "Second step", description: "active" },
      };
      elements.sep1 = { type: "separator", props: {} };
      break;
    }
    case 4: {
      // Grid doesn't exist in the new format — show items representing the grid cells
      elements.page = {
        type: "stack",
        props: {},
        children: [
          "title",
          "row-a",
          "row-b",
          "sep1",
          "btn-next",
        ],
      };
      elements.title = {
        type: "item",
        props: { title: "Grid (as items)" },
      };
      elements["row-a"] = {
        type: "stack",
        props: { direction: "horizontal" },
        children: ["cell-a1", "cell-a2", "cell-a3"],
      };
      elements["cell-a1"] = {
        type: "badge",
        props: { label: "A1", variant: "secondary" },
      };
      elements["cell-a2"] = {
        type: "badge",
        props: { label: "A2", variant: "secondary" },
      };
      elements["cell-a3"] = {
        type: "badge",
        props: { label: "A3", variant: "secondary" },
      };
      elements["row-b"] = {
        type: "stack",
        props: { direction: "horizontal" },
        children: ["cell-b1", "cell-b2", "cell-b3"],
      };
      elements["cell-b1"] = {
        type: "badge",
        props: { label: "B1", variant: "secondary" },
      };
      elements["cell-b2"] = {
        type: "badge",
        props: { label: "B2", variant: "secondary" },
      };
      elements["cell-b3"] = {
        type: "badge",
        props: { label: "B3", variant: "secondary" },
      };
      elements.sep1 = { type: "separator", props: {} };
      break;
    }
  }

  // Add the shared next button
  elements["btn-next"] = {
    type: "button",
    props: { label: "Next" },
    on: {
      press: {
        action: "submit",
        params: { target: `${snapBaseUrl}/?page=${nextPage}` },
      },
    },
  };

  return {
    version: "2.0",
    theme: sharedTheme,
    ui: {
      root: "page",
      elements: elements as any,
    },
  };
}

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const pageIndex = pageIndexFromQuery(url.searchParams.get("page"));
  const snapBaseUrl = snapBaseUrlFromRequest(ctx.request);
  return buildSnapRoot(pageIndex, snapBaseUrl);
});

export default app;
