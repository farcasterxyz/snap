import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View = "home" | "text" | "inputs" | "inputs_result" | "dataviz" | "grid" | "tall";

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const rawView = url.searchParams.get("view") ?? "home";
  const view = (
    ["home", "text", "inputs", "inputs_result", "dataviz", "grid", "tall"].includes(
      rawView,
    )
      ? rawView
      : "home"
  ) as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") {
    return view === "tall" ? tallPage(base) : homePage(base);
  }

  if (view === "inputs_result" && ctx.action.type === "post") {
    return inputsResultPage(base, ctx.action.inputs, ctx.action.button_index);
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
    case "tall":
      return tallPage(base);
    default:
      return homePage(base);
  }
});

export default app;

// ─── Pages ──────────────────────────────────────────────

function homePage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "description", "showcase-image", "btn-row"],
        },
        title: {
          type: "item",
          props: { title: "Snap Element Showcase" },
        },
        description: {
          type: "item",
          props: {
            description:
              "Every snap element type in one place. Tap a category to explore.",
          },
        },
        "showcase-image": {
          type: "image",
          props: {
            url: "https://placehold.co/600x200.png?text=Element+Showcase",
            aspect: "3:1",
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-text", "btn-inputs", "btn-dataviz", "btn-grid"],
        },
        "btn-text": {
          type: "button",
          props: { label: "Text & Layout" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=text` },
            },
          },
        },
        "btn-inputs": {
          type: "button",
          props: { label: "Inputs" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs` },
            },
          },
        },
        "btn-dataviz": {
          type: "button",
          props: { label: "Data Viz" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=dataviz` },
            },
          },
        },
        "btn-grid": {
          type: "button",
          props: { label: "Grid & FX" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=grid` },
            },
          },
        },
      },
    },
  };
}

function textPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "blue" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "badges-row",
            "body",
            "sep",
            "caption",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Text & Layout" },
        },
        "badges-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["badge-pts", "badge-rank", "badge-level"],
        },
        "badge-pts": {
          type: "badge",
          props: { content: "42 pts", variant: "secondary" },
        },
        "badge-rank": {
          type: "badge",
          props: { content: "Rank #1", variant: "secondary" },
        },
        "badge-level": {
          type: "badge",
          props: { content: "Level 5", variant: "secondary" },
        },
        body: {
          type: "item",
          props: {
            description:
              "Body text: max 160 chars. Great for descriptions. Groups arrange children side by side in a row.",
          },
        },
        sep: { type: "separator", props: {} },
        caption: {
          type: "badge",
          props: {
            content:
              "Caption (100 chars) — timestamps, attribution, metadata",
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-home", "btn-inputs"],
        },
        "btn-home": {
          type: "button",
          props: { label: "← Home" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=home` },
            },
          },
        },
        "btn-inputs": {
          type: "button",
          props: { label: "Inputs →" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs` },
            },
          },
        },
      },
    },
  };
}

function inputsPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "pick-group",
            "rating-slider",
            "comment-input",
            "notify-switch",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Input Elements" },
        },
        "pick-group": {
          type: "toggle_group",
          props: { name: "pick", options: [{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }, { value: "gamma", label: "Gamma" }] },
        },
        "rating-slider": {
          type: "slider",
          props: {
            name: "rating",
            min: 0,
            max: 10,
            step: 1,
            value: 5,
            label: "Rating",
            minLabel: "0",
            maxLabel: "10",
          },
        },
        "comment-input": {
          type: "input",
          props: {
            name: "comment",
            placeholder: "Type something here...",
            maxLength: 100,
          },
        },
        "notify-switch": {
          type: "switch",
          props: { name: "notify", label: "Enable notifications" },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-text", "btn-submit", "btn-dataviz"],
        },
        "btn-text": {
          type: "button",
          props: { label: "← Text" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=text` },
            },
          },
        },
        "btn-submit": {
          type: "button",
          props: { label: "Submit" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs_result` },
            },
          },
        },
        "btn-dataviz": {
          type: "button",
          props: { label: "Data Viz →" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=dataviz` },
            },
          },
        },
      },
    },
  };
}

function inputsResultPage(
  base: string,
  inputs: Record<string, unknown>,
  button_index: number,
): SnapHandlerResult {
  const pick = typeof inputs.pick === "string" ? inputs.pick : "(none)";
  const rating = typeof inputs.rating === "number" ? inputs.rating : "?";
  const comment =
    typeof inputs.comment === "string" && inputs.comment
      ? inputs.comment
      : "(empty)";
  const notify = inputs.notify === true ? "ON" : "OFF";

  return {
    version: "1.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "result-group",
            "result-rating",
            "result-comment",
            "result-notify",
            "caption",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Submitted!" },
        },
        "result-group": {
          type: "item",
          props: { title: `Group: ${pick}`, description: "toggle_group" },
        },
        "result-rating": {
          type: "item",
          props: { title: `Rating: ${rating}`, description: "slider" },
        },
        "result-comment": {
          type: "item",
          props: {
            title: `Comment: ${clamp(String(comment), 60)}`,
            description: "text_input",
          },
        },
        "result-notify": {
          type: "item",
          props: {
            title: `Notifications: ${notify}`,
            description: "toggle",
          },
        },
        caption: {
          type: "badge",
          props: {
            content: `Button index: ${button_index}. All input values sent via POST.`,
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-try-again", "btn-dataviz"],
        },
        "btn-try-again": {
          type: "button",
          props: { label: "← Try Again" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs` },
            },
          },
        },
        "btn-dataviz": {
          type: "button",
          props: { label: "Data Viz →" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=dataviz` },
            },
          },
        },
      },
    },
  };
}

function dataVizPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "completion-progress",
            "bar-apples",
            "bar-bananas",
            "bar-grapes",
            "bar-mango",
            "sep",
            "leader-1",
            "leader-2",
            "leader-3",
            "btn-row",
          ],
        },
        title: {
          type: "item",
          props: { title: "Data Visualization" },
        },
        "completion-progress": {
          type: "progress",
          props: { value: 72, max: 100, label: "72% Complete" },
        },
        "bar-apples": {
          type: "progress",
          props: { value: 42, max: 50, label: "Apples" },
        },
        "bar-bananas": {
          type: "progress",
          props: { value: 28, max: 50, label: "Bananas" },
        },
        "bar-grapes": {
          type: "progress",
          props: { value: 15, max: 50, label: "Grapes" },
        },
        "bar-mango": {
          type: "progress",
          props: { value: 35, max: 50, label: "Mango" },
        },
        sep: { type: "separator", props: {} },
        "leader-1": {
          type: "item",
          props: { title: "1. @alice", description: "950 pts" },
        },
        "leader-2": {
          type: "item",
          props: { title: "2. @bob", description: "820 pts" },
        },
        "leader-3": {
          type: "item",
          props: { title: "3. @charlie", description: "710 pts" },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-inputs", "btn-grid"],
        },
        "btn-inputs": {
          type: "button",
          props: { label: "← Inputs" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs` },
            },
          },
        },
        "btn-grid": {
          type: "button",
          props: { label: "Grid & FX →" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=grid` },
            },
          },
        },
      },
    },
  };
}

function gridPage(base: string): SnapHandlerResult {
  // Grid doesn't exist in the new format — show the pixel art as an image instead
  return {
    version: "1.0",
    theme: { accent: "pink" },
    effects: ["confetti"],
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "body", "pixel-art", "btn-row"],
        },
        title: {
          type: "item",
          props: { title: "Grid & Effects" },
        },
        body: {
          type: "item",
          props: {
            description:
              "Grids are replaced by images in the new format. This page triggers confetti!",
          },
        },
        "pixel-art": {
          type: "image",
          props: {
            url: "https://placehold.co/400x400.png?text=Pixel+Art+Smiley",
            aspect: "1:1",
          },
        },
        "btn-row": {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-dataviz", "btn-home"],
        },
        "btn-dataviz": {
          type: "button",
          props: { label: "← Data Viz" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=dataviz` },
            },
          },
        },
        "btn-home": {
          type: "button",
          props: { label: "Home" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=home` },
            },
          },
        },
      },
    },
  };
}

function tallPage(base: string): SnapHandlerResult {
  const children: string[] = ["title"];
  const elements: Record<string, unknown> = {
    page: { type: "stack", props: {}, children },
    title: { type: "item", props: { title: "Tall Snap Example" } },
  };

  for (let i = 0; i < 5; i++) {
    const id = `item_${i}`;
    elements[id] = {
      type: "item",
      props: {
        title: `Item ${i + 1}`,
        description: "This content makes the snap taller than 500px to test the height indicator overlay.",
      },
    };
    children.push(id);
  }

  children.push("btn-home");
  elements["btn-home"] = {
    type: "button",
    props: { label: "Home" },
    on: {
      press: {
        action: "submit",
        params: { target: `${base}/?view=home` },
      },
    },
  };

  return {
    version: "2.0",
    theme: { accent: "red" },
    ui: { root: "page", elements },
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
