import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View = "home" | "content" | "inputs" | "results" | "actions";

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const view = (url.searchParams.get("view") ?? "home") as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") return homePage(base);

  if (view === "results" && ctx.action.type === "post") {
    return resultsPage(base, ctx.action.inputs);
  }

  switch (view) {
    case "content":
      return contentPage(base);
    case "inputs":
      return inputsPage(base);
    case "actions":
      return actionsPage(base);
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
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "image", "nav"],
        },
        title: {
          type: "item",
          props: {
            title: "Snap Component Catalog",
            description: "Browse every component type and action.",
          },
        },
        image: {
          type: "image",
          props: {
            url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=450&fit=crop&auto=format",
            aspect: "16:9",
          },
        },
        nav: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["btn-content", "btn-inputs", "btn-actions"],
        },
        "btn-content": {
          type: "button",
          props: { label: "Content" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=content` },
            },
          },
        },
        "btn-inputs": {
          type: "button",
          props: { label: "Inputs", variant: "outline" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=inputs` },
            },
          },
        },
        "btn-actions": {
          type: "button",
          props: { label: "Actions", variant: "outline" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=actions` },
            },
          },
        },
      },
    },
  };
}

function contentPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "blue" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["header", "badges", "sep1", "items", "sep2", "row", "back"],
        },
        header: {
          type: "item",
          props: { title: "Content Components" },
        },
        badges: {
          type: "stack",
          props: { direction: "horizontal", gap: "sm" },
          children: ["b1", "b2", "b3", "b4"],
        },
        b1: { type: "badge", props: { label: "Accent" } },
        b2: { type: "badge", props: { label: "Blue", color: "blue" } },
        b3: { type: "badge", props: { label: "Red", color: "red" } },
        b4: { type: "badge", props: { label: "Green", color: "green" } },
        sep1: { type: "separator", props: {} },
        items: {
          type: "stack",
          props: { gap: "sm" },
          children: ["item-default", "item-outline", "item-muted"],
        },
        "item-default": {
          type: "item",
          props: {
            title: "Default Item",
            description: "With a description",
            trailing: "42",
          },
        },
        "item-outline": {
          type: "item",
          props: {
            title: "Outline Item",
            description: "Bordered variant",
            variant: "outline",
          },
        },
        "item-muted": {
          type: "item",
          props: {
            title: "Muted Item",
            description: "Subtle background",
            variant: "muted",
            trailing: "new",
          },
        },
        sep2: { type: "separator", props: {} },
        row: {
          type: "stack",
          props: { direction: "horizontal" },
          children: ["prog1", "prog2"],
        },
        prog1: {
          type: "progress",
          props: { value: 65, max: 100, label: "Upload" },
        },
        prog2: {
          type: "progress",
          props: { value: 30, max: 100, label: "Process" },
        },
        back: {
          type: "button",
          props: { label: "Back", variant: "ghost" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
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
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["header", "name-input", "slider", "switch", "choice", "tags", "submit"],
        },
        header: {
          type: "item",
          props: { title: "Input Components", description: "Try the interactive elements." },
        },
        "name-input": {
          type: "input",
          props: { name: "username", label: "Username", placeholder: "Enter your name" },
        },
        slider: {
          type: "slider",
          props: { name: "rating", min: 1, max: 10, step: 1, defaultValue: 5, label: "Rating (1-10)" },
        },
        switch: {
          type: "switch",
          props: { name: "notifications", label: "Enable notifications" },
        },
        choice: {
          type: "toggle_group",
          props: {
            name: "plan",
            label: "Plan",
            options: ["Free", "Pro", "Team"],
          },
        },
        tags: {
          type: "toggle_group",
          props: {
            name: "interests",
            mode: "multiple",
            options: ["Dev", "Design", "Data"],
          },
        },
        submit: {
          type: "button",
          props: { label: "Submit" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=results` },
            },
          },
        },
      },
    },
  };
}

function resultsPage(
  base: string,
  inputs: Record<string, unknown>,
): SnapHandlerResult {
  const username = String(inputs.username ?? "(empty)");
  const rating = String(inputs.rating ?? "?");
  const notifications = inputs.notifications ? "Yes" : "No";
  const plan = String(inputs.plan ?? "(none)");
  const interests = Array.isArray(inputs.interests)
    ? inputs.interests.join(", ")
    : String(inputs.interests ?? "(none)");

  return {
    version: "1.0",
    theme: { accent: "green" },
    effects: ["confetti"],
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["header", "results", "again"],
        },
        header: {
          type: "item",
          props: { title: "Submitted!", description: "Here's what you entered." },
        },
        results: {
          type: "item_group",
          props: {},
          children: ["r-user", "r-rating", "r-notify", "r-plan", "r-interests"],
        },
        "r-user": {
          type: "item",
          props: { title: "Username" },
          children: ["r-user-val"],
        },
        "r-user-val": {
          type: "badge",
          props: { label: username, color: "gray" },
        },
        "r-rating": {
          type: "item",
          props: { title: "Rating" },
          children: ["r-rating-val"],
        },
        "r-rating-val": {
          type: "badge",
          props: { label: `${rating}/10`, color: "gray" },
        },
        "r-notify": {
          type: "item",
          props: { title: "Notifications" },
          children: ["r-notify-val"],
        },
        "r-notify-val": {
          type: "badge",
          props: { label: notifications, color: notifications === "Yes" ? "green" : "gray" },
        },
        "r-plan": {
          type: "item",
          props: { title: "Plan" },
          children: ["r-plan-val"],
        },
        "r-plan-val": {
          type: "badge",
          props: { label: plan, color: "gray" },
        },
        "r-interests": {
          type: "item",
          props: { title: "Interests" },
          children: ["r-interests-val"],
        },
        "r-interests-val": {
          type: "badge",
          props: { label: interests || "(none)", color: "gray" },
        },
        again: {
          type: "button",
          props: { label: "Try Again", variant: "outline" },
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

function actionsPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "purple" },
    spec: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["header", "sep", "snap-actions", "client-actions", "back"],
        },
        header: {
          type: "item",
          props: { title: "Action Types", description: "Every action the spec supports." },
        },
        sep: { type: "separator", props: {} },
        "snap-actions": {
          type: "stack",
          props: { gap: "sm" },
          children: ["btn-post", "btn-link", "btn-miniapp"],
        },
        "btn-post": {
          type: "button",
          props: { label: "submit (reload)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=actions` },
            },
          },
        },
        "btn-link": {
          type: "button",
          props: { label: "open_url (open browser)", variant: "outline" },
          on: {
            press: {
              action: "open_url",
              params: { target: "https://farcaster.xyz" },
            },
          },
        },
        "btn-miniapp": {
          type: "button",
          props: { label: "open_mini_app", variant: "outline" },
          on: {
            press: {
              action: "open_mini_app",
              params: { target: "https://farcaster.xyz" },
            },
          },
        },
        "client-actions": {
          type: "stack",
          props: { gap: "sm" },
          children: ["btn-viewcast", "btn-compose"],
        },
        "btn-viewcast": {
          type: "button",
          props: { label: "view_cast", color: "gray" },
          on: {
            press: {
              action: "view_cast",
              params: { hash: "0x0000000000000000000000000000000000000001" },
            },
          },
        },
        "btn-compose": {
          type: "button",
          props: { label: "compose_cast", color: "gray" },
          on: {
            press: {
              action: "compose_cast",
              params: { text: "gm from the snap catalog!" },
            },
          },
        },
        back: {
          type: "button",
          props: { label: "Home", variant: "ghost" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
      },
    },
  };
}

// ─── Helpers ────────────────────────────────────────────

function snapBaseUrl(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  const host = (forwardedHost ?? hostHeader)?.split(",")[0].trim();
  const isLoopback =
    host !== undefined &&
    /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/.test(host);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim().toLowerCase()
    : isLoopback
    ? "http"
    : "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3020"}`.replace(/\/$/, "");
}
