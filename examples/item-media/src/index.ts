import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  const url = new URL(ctx.request.url);
  const base = snapBaseUrlFromRequest(ctx.request);

  if (ctx.action.type === "post") {
    const selected =
      typeof ctx.action.inputs.preference === "string"
        ? ctx.action.inputs.preference
        : (url.searchParams.get("preference") ?? "no selection");
    return selectedPage(base, selected);
  }

  return homePage(base);
});

export default app;

function homePage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "summary", "people", "tools", "submit"],
        },
        title: {
          type: "item",
          props: {
            title: "Item media examples",
            description: "Icon and image media render on the left.",
            media: { variant: "icon", name: "image", color: "teal" },
          },
          children: ["title-badge"],
        },
        "title-badge": {
          type: "badge",
          props: { label: "2.0", color: "teal" },
        },
        summary: {
          type: "text",
          props: {
            content:
              "Each row uses props.media. Children still render on the right as actions or metadata.",
            size: "sm",
          },
        },
        people: {
          type: "item_group",
          props: { border: true, separator: true },
          children: ["designer", "engineer", "producer"],
        },
        designer: {
          type: "item",
          props: {
            title: "Ari Lane",
            description: "Image media with a trailing profile action.",
            media: {
              variant: "image",
              url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
              alt: "Ari Lane avatar",
              round: true,
            },
          },
          children: ["designer-action"],
        },
        "designer-action": {
          type: "button",
          props: { label: "Profile", icon: "user" },
          on: {
            press: { action: "view_profile", params: { fid: 3 } },
          },
        },
        engineer: {
          type: "item",
          props: {
            title: "Build health",
            description: "Icon media with palette color and a status badge.",
            media: { variant: "icon", name: "check", color: "green" },
          },
          children: ["engineer-badge"],
        },
        "engineer-badge": {
          type: "badge",
          props: { label: "Passing", color: "green", icon: "check" },
        },
        producer: {
          type: "item",
          props: {
            title: "New album",
            description: "Image media with a trailing icon.",
            media: {
              variant: "image",
              url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=120&h=120&q=80",
              alt: "Performer on stage",
            },
          },
          children: ["producer-icon"],
        },
        "producer-icon": {
          type: "icon",
          props: { name: "play", color: "purple" },
        },
        tools: {
          type: "item_group",
          props: { separator: true },
          children: ["wallet", "warning"],
        },
        wallet: {
          type: "item",
          props: {
            title: "Wallet ready",
            description: "Icon media works without a right-side child.",
            media: { variant: "icon", name: "wallet", color: "blue" },
          },
        },
        warning: {
          type: "item",
          props: {
            title: "Action needed",
            description: "Icon media can pair with a right-side button.",
            media: { variant: "icon", name: "alert-triangle", color: "amber" },
          },
          children: ["warning-action"],
        },
        "warning-action": {
          type: "button",
          props: { label: "Review" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?preference=review` },
            },
          },
        },
        submit: {
          type: "button",
          props: { label: "Choose icon media", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?preference=icon` },
            },
          },
        },
      },
    },
  };
}

function selectedPage(base: string, selected: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "result", "back"],
        },
        title: {
          type: "item",
          props: {
            title: "Selection received",
            description: `Server saw preference: ${selected}`,
            media: { variant: "icon", name: "check", color: "green" },
          },
        },
        result: {
          type: "item",
          props: {
            title: "Media contract",
            description: "Icon media uses name/color; image media uses url/alt.",
            media: {
              variant: "image",
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=120&h=120&q=80",
              alt: "Confirmation",
              round: true,
            },
          },
        },
        back: {
          type: "button",
          props: { label: "Back", icon: "arrow-left" },
          on: {
            press: { action: "submit", params: { target: `${base}/` } },
          },
        },
      },
    },
  };
}

function snapBaseUrlFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return `http://localhost:${process.env.PORT ?? "3021"}`.replace(/\/$/, "");
}
