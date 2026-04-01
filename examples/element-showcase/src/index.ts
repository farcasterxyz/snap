import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapResponse } from "@farcaster/snap";

type View = "home" | "text" | "inputs" | "inputs_result" | "dataviz" | "grid";

const PALETTE_HEX = [
  "#8B5CF6",
  "#006BFF",
  "#00AC96",
  "#28A948",
  "#FFAE00",
  "#FC0036",
  "#F32782",
];

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const rawView = url.searchParams.get("view") ?? "home";
  const view = (
    ["home", "text", "inputs", "inputs_result", "dataviz", "grid"].includes(
      rawView,
    )
      ? rawView
      : "home"
  ) as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") return homePage(base);

  if (view === "inputs_result" && ctx.action.type === "post") {
    return inputsResultPage(base, ctx.action.inputs, ctx.action.buttonIndex);
  }

  switch (view) {
    case "text":
      return textPage(base);
    case "inputs":
      return inputsPage(base);
    case "dataviz":
      return dataVizPage(base);
    case "grid":
      return gridPage(base);
    default:
      return homePage(base);
  }
});

export default app;

// ─── Pages ──────────────────────────────────────────────

function homePage(base: string): SnapResponse {
  const cells: { row: number; col: number; color: string }[] = [];
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 7; c++)
      cells.push({
        row: r,
        col: c,
        color: PALETTE_HEX[(c + r) % PALETTE_HEX.length]!,
      });

  return {
    version: "1.0",
    page: {
      theme: { accent: "purple" },
      button_layout: "grid",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Snap Element Showcase",
            align: "center",
          },
          {
            type: "text",
            style: "body",
            content:
              "Every snap element type in one place. Tap a category to explore.",
          },
          {
            type: "grid",
            cols: 7,
            rows: 2,
            cells,
            cellSize: "square",
            gap: "small",
          },
        ],
      },
      buttons: [
        {
          label: "Text & Layout",
          action: "post",
          target: `${base}/?view=text`,
        },
        { label: "Inputs", action: "post", target: `${base}/?view=inputs` },
        {
          label: "Data Viz",
          action: "post",
          target: `${base}/?view=dataviz`,
        },
        {
          label: "Grid & FX",
          action: "post",
          target: `${base}/?view=grid`,
        },
      ],
    },
  };
}

function textPage(base: string): SnapResponse {
  return {
    version: "1.0",
    page: {
      theme: { accent: "blue" },
      button_layout: "row",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Text & Layout",
            align: "center",
          },
          {
            type: "group",
            layout: "row",
            children: [
              { type: "text", style: "label", content: "42 pts" },
              { type: "text", style: "label", content: "Rank #1" },
              { type: "text", style: "label", content: "Level 5" },
            ],
          },
          {
            type: "text",
            style: "body",
            content:
              "Body text: max 160 chars. Great for descriptions. Groups arrange children side by side in a row.",
          },
          { type: "divider" },
          {
            type: "text",
            style: "caption",
            content: "Caption (100 chars) — timestamps, attribution, metadata",
          },
        ],
      },
      buttons: [
        { label: "← Home", action: "post", target: `${base}/?view=home` },
        {
          label: "Inputs →",
          action: "post",
          target: `${base}/?view=inputs`,
        },
      ],
    },
  };
}

function inputsPage(base: string): SnapResponse {
  return {
    version: "1.0",
    page: {
      theme: { accent: "teal" },
      button_layout: "row",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Input Elements",
            align: "center",
          },
          {
            type: "button_group",
            name: "pick",
            options: ["Alpha", "Beta", "Gamma"],
            style: "row",
          },
          {
            type: "slider",
            name: "rating",
            min: 0,
            max: 10,
            step: 1,
            value: 5,
            label: "Rating",
            minLabel: "0",
            maxLabel: "10",
          },
          {
            type: "text_input",
            name: "comment",
            placeholder: "Type something here...",
            maxLength: 100,
          },
          {
            type: "toggle",
            name: "notify",
            label: "Enable notifications",
            value: false,
          },
        ],
      },
      buttons: [
        { label: "← Text", action: "post", target: `${base}/?view=text` },
        {
          label: "Submit",
          action: "post",
          target: `${base}/?view=inputs_result`,
          style: "primary",
        },
        {
          label: "Data Viz →",
          action: "post",
          target: `${base}/?view=dataviz`,
        },
      ],
    },
  };
}

function inputsResultPage(
  base: string,
  inputs: Record<string, unknown>,
  button_index: number,
): SnapResponse {
  const pick = typeof inputs.pick === "string" ? inputs.pick : "(none)";
  const rating = typeof inputs.rating === "number" ? inputs.rating : "?";
  const comment =
    typeof inputs.comment === "string" && inputs.comment
      ? inputs.comment
      : "(empty)";
  const notify = inputs.notify === true ? "ON" : "OFF";

  return {
    version: "1.0",
    page: {
      theme: { accent: "green" },
      button_layout: "row",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Submitted!",
            align: "center",
          },
          {
            type: "list",
            style: "plain",
            items: [
              { content: `Group: ${pick}`, trailing: "button_group" },
              { content: `Rating: ${rating}`, trailing: "slider" },
              {
                content: `Comment: ${clamp(String(comment), 60)}`,
                trailing: "text_input",
              },
              { content: `Notifications: ${notify}`, trailing: "toggle" },
            ],
          },
          {
            type: "text",
            style: "caption",
            content: `Button index: ${button_index}. All input values sent via POST.`,
          },
        ],
      },
      buttons: [
        {
          label: "← Try Again",
          action: "post",
          target: `${base}/?view=inputs`,
        },
        {
          label: "Data Viz →",
          action: "post",
          target: `${base}/?view=dataviz`,
        },
      ],
    },
  };
}

function dataVizPage(base: string): SnapResponse {
  return {
    version: "1.0",
    page: {
      theme: { accent: "amber" },
      button_layout: "row",
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Data Visualization",
            align: "center",
          },
          {
            type: "progress",
            value: 72,
            max: 100,
            label: "72% Complete",
            color: "green",
          },
          {
            type: "bar_chart",
            bars: [
              { label: "Apples", value: 42, color: "red" },
              { label: "Bananas", value: 28, color: "amber" },
              { label: "Grapes", value: 15, color: "purple" },
              { label: "Mango", value: 35, color: "green" },
            ],
            max: 50,
          },
          {
            type: "list",
            style: "ordered",
            items: [
              { content: "@alice", trailing: "950 pts" },
              { content: "@bob", trailing: "820 pts" },
              { content: "@charlie", trailing: "710 pts" },
            ],
          },
        ],
      },
      buttons: [
        {
          label: "← Inputs",
          action: "post",
          target: `${base}/?view=inputs`,
        },
        {
          label: "Grid & FX →",
          action: "post",
          target: `${base}/?view=grid`,
        },
      ],
    },
  };
}

function gridPage(base: string): SnapResponse {
  const BG = "#1E1E2E";
  const YL = "#FACC15";
  const BK = "#0F172A";
  const RD = "#FC0036";

  const face = new Map<string, string>([
    ["1,2", YL],
    ["1,3", YL],
    ["1,4", YL],
    ["1,5", YL],
    ["2,1", YL],
    ["2,2", YL],
    ["2,3", YL],
    ["2,4", YL],
    ["2,5", YL],
    ["2,6", YL],
    ["3,1", YL],
    ["3,2", BK],
    ["3,3", YL],
    ["3,4", YL],
    ["3,5", BK],
    ["3,6", YL],
    ["4,1", YL],
    ["4,2", YL],
    ["4,3", YL],
    ["4,4", YL],
    ["4,5", YL],
    ["4,6", YL],
    ["5,1", YL],
    ["5,2", RD],
    ["5,3", YL],
    ["5,4", YL],
    ["5,5", RD],
    ["5,6", YL],
    ["6,1", YL],
    ["6,2", YL],
    ["6,3", RD],
    ["6,4", RD],
    ["6,5", YL],
    ["6,6", YL],
  ]);

  const cells: { row: number; col: number; color: string }[] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      cells.push({ row: r, col: c, color: face.get(`${r},${c}`) ?? BG });

  return {
    version: "1.0",
    page: {
      theme: { accent: "pink" },
      button_layout: "row",
      effects: ["confetti"],
      elements: {
        type: "stack",
        children: [
          {
            type: "text",
            style: "title",
            content: "Grid & Effects",
            align: "center",
          },
          {
            type: "text",
            style: "body",
            content:
              "Grids render pixel art and game boards. This page triggers confetti!",
          },
          {
            type: "grid",
            cols: 8,
            rows: 8,
            cells,
            cellSize: "square",
            gap: "none",
          },
        ],
      },
      buttons: [
        {
          label: "← Data Viz",
          action: "post",
          target: `${base}/?view=dataviz`,
        },
        {
          label: "Home",
          action: "post",
          target: `${base}/?view=home`,
          style: "primary",
        },
      ],
    },
  };
}

// ─── Helpers ────────────────────────────────────────────

function snapBaseUrl(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3012"}`.replace(/\/$/, "");
}

function clamp(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + "...";
}
