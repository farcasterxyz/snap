import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapHandlerResult } from "@farcaster/snap";

type View =
  | "home"
  | "v1-loose"
  | "v1-tall"
  | "v2-strict"
  | "v2-tall"
  | "v2-invalid";

const app = new Hono();

registerSnapHandler(app, async (ctx) => {
  const url = new URL(ctx.request.url);
  const rawView = url.searchParams.get("view") ?? "home";
  const view = (
    ["home", "v1-loose", "v1-tall", "v2-strict", "v2-tall", "v2-invalid"].includes(rawView)
      ? rawView
      : "home"
  ) as View;
  const base = snapBaseUrl(ctx.request);

  if (ctx.action.type === "get") {
    return homePage(base);
  }

  switch (view) {
    case "v1-loose":
      return v1LoosePage(base);
    case "v1-tall":
      return v1TallPage(base);
    case "v2-strict":
      return v2StrictPage(base);
    case "v2-tall":
      return v2TallPage(base);
    case "v2-invalid":
      return v2InvalidPage(base);
    default:
      return homePage(base);
  }
});

export default app;

// ─── Pages ──────────────────────────────────────────────

/**
 * Home page (v1) — hub for navigating to version-specific tests.
 */
function homePage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "purple" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "desc",
            "btn-v1",
            "btn-v1-tall",
            "btn-v2",
            "btn-v2-tall",
            "btn-v2-invalid",
          ],
        },
        title: {
          type: "item",
          props: { title: "Version Test" },
        },
        desc: {
          type: "item",
          props: {
            description:
              "Tests version-aware rendering. V1 skips structural/URL validation. V2 enforces constraints and height limits.",
          },
        },
        "btn-v1": {
          type: "button",
          props: { label: "V1 Loose (10 root children)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=v1-loose` },
            },
          },
        },
        "btn-v1-tall": {
          type: "button",
          props: { label: "V1 Tall (expand test)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=v1-tall` },
            },
          },
        },
        "btn-v2": {
          type: "button",
          props: { label: "V2 Strict (7 root children)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=v2-strict` },
            },
          },
        },
        "btn-v2-tall": {
          type: "button",
          props: { label: "V2 Tall (overflow test)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=v2-tall` },
            },
          },
        },
        "btn-v2-invalid": {
          type: "button",
          props: { label: "V2 Invalid (8 root children)" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?view=v2-invalid` },
            },
          },
        },
      },
    },
  };
}

/**
 * V1 page with 10 root children — exceeds MAX_ROOT_CHILDREN but passes
 * because v1 skips structural validation.
 */
function v1LoosePage(base: string): SnapHandlerResult {
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
            "badge-v1",
            "desc",
            "item-1",
            "item-2",
            "item-3",
            "item-4",
            "item-5",
            "item-6",
            "btn-home",
          ],
        },
        title: { type: "item", props: { title: "V1 Loose Mode" } },
        "badge-v1": {
          type: "badge",
          props: { label: "v1 — 10 root children" },
        },
        desc: {
          type: "item",
          props: {
            description:
              "This page has 10 root children. It would fail V2 validation (max 7) but passes because V1 skips structural checks.",
          },
        },
        "item-1": { type: "item", props: { title: "Item 1", description: "Extra content" } },
        "item-2": { type: "item", props: { title: "Item 2", description: "Extra content" } },
        "item-3": { type: "item", props: { title: "Item 3", description: "Extra content" } },
        "item-4": { type: "item", props: { title: "Item 4", description: "Extra content" } },
        "item-5": { type: "item", props: { title: "Item 5", description: "Extra content" } },
        "item-6": { type: "item", props: { title: "Item 6", description: "Extra content" } },
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
      },
    },
  };
}

/**
 * V1 tall page — mirrors the V2 tall content so V1 expandable overflow
 * behavior can be compared directly against V2 clipping.
 */
function v1TallPage(base: string): SnapHandlerResult {
  return {
    version: "1.0",
    theme: { accent: "red" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "badge", "items", "btn-home"],
        },
        title: { type: "item", props: { title: "V1 Tall Page" } },
        badge: {
          type: "badge",
          props: { label: "v1 — expands past 500px with show more" },
        },
        items: {
          type: "stack",
          props: {},
          children: ["i1", "i2", "i3", "i4", "i5", "i6"],
        },
        i1: { type: "item", props: { title: "Section 1", description: "Padding content to push the page past the 500px height limit for testing expandable overflow behavior." } },
        i2: { type: "item", props: { title: "Section 2", description: "More content to increase total height. V1 should collapse first, then expand when Show more is pressed." } },
        i3: { type: "item", props: { title: "Section 3", description: "Continuing to add vertical content so the snap exceeds the collapsed area and makes the toggle appear." } },
        i4: { type: "item", props: { title: "Section 4", description: "Below the fold. This content should be hidden in the collapsed state and visible once expanded." } },
        i5: { type: "item", props: { title: "Section 5", description: "Still going. This helps compare the V1 expandable card path against the V2 clipped card path." } },
        i6: { type: "item", props: { title: "Section 6", description: "The bottom of the tall page. After expansion, Show less should collapse the card again." } },
        "btn-home": {
          type: "button",
          props: { label: "← Home (v1)" },
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

/**
 * V2 page with exactly 7 root children — at the MAX_ROOT_CHILDREN limit.
 * Should render with validation passing.
 */
function v2StrictPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "green" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "badge-v2",
            "desc",
            "progress",
            "sep",
            "input-group",
            "btn-home",
          ],
        },
        title: { type: "item", props: { title: "V2 Strict Mode" } },
        "badge-v2": {
          type: "badge",
          props: { label: "v2 — 7 root children (limit)" },
        },
        desc: {
          type: "item",
          props: {
            description:
              "This page has exactly 7 root children (the max). V2 validation passes. Height is clipped at 500px.",
          },
        },
        progress: {
          type: "progress",
          props: { value: 7, max: 7, label: "Root children: 7/7" },
        },
        sep: { type: "separator", props: {} },
        "input-group": {
          type: "stack",
          props: {},
          children: ["slider", "toggle"],
        },
        slider: {
          type: "slider",
          props: { name: "rating", min: 0, max: 10, step: 1, defaultValue: 5, label: "Rating", showValue: true },
        },
        toggle: {
          type: "toggle_group",
          props: { name: "choice", options: ["Pass", "Fail"] },
        },
        "btn-home": {
          type: "button",
          props: { label: "← Home (v1)" },
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

/**
 * V2 tall page — content exceeds 500px to test height clipping
 * and the showOverflowWarning overlay in the emulator.
 */
function v2TallPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "red" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: ["title", "badge", "items", "btn-home"],
        },
        title: { type: "item", props: { title: "V2 Tall Page" } },
        badge: {
          type: "badge",
          props: { label: "v2 — clips at 500px" },
        },
        items: {
          type: "stack",
          props: {},
          children: ["i1", "i2", "i3", "i4", "i5", "i6"],
        },
        i1: { type: "item", props: { title: "Section 1", description: "Padding content to push the page past the 500px height limit for testing overflow behavior." } },
        i2: { type: "item", props: { title: "Section 2", description: "More content to increase total height. The emulator should show a 500px dashed line here." } },
        i3: { type: "item", props: { title: "Section 3", description: "Continuing to add vertical content so the snap exceeds the visible area in production clients." } },
        i4: { type: "item", props: { title: "Section 4", description: "Below the fold. In a real client this would be clipped. The emulator shows hazard stripes." } },
        i5: { type: "item", props: { title: "Section 5", description: "Still going. This content is well below 500px and demonstrates the overflow warning zone." } },
        i6: { type: "item", props: { title: "Section 6", description: "The very bottom. Only visible if showOverflowWarning is enabled (up to 700px)." } },
        "btn-home": {
          type: "button",
          props: { label: "← Home (v1)" },
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

/**
 * V2 page that intentionally exceeds MAX_ROOT_CHILDREN (8 > 7).
 * The server-side validator should reject this with a 400 error.
 */
function v2InvalidPage(base: string): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "amber" },
    ui: {
      root: "page",
      elements: {
        page: {
          type: "stack",
          props: {},
          children: [
            "title",
            "badge",
            "desc",
            "item-1",
            "item-2",
            "item-3",
            "item-4",
            "btn-home",
          ],
        },
        title: { type: "item", props: { title: "V2 Invalid" } },
        badge: {
          type: "badge",
          props: { label: "v2 — 8 children (over limit)" },
        },
        desc: {
          type: "item",
          props: {
            description: "This page has 8 root children but V2 max is 7. Server should reject with validation error.",
          },
        },
        "item-1": { type: "item", props: { title: "Extra 1" } },
        "item-2": { type: "item", props: { title: "Extra 2" } },
        "item-3": { type: "item", props: { title: "Extra 3" } },
        "item-4": { type: "item", props: { title: "Extra 4" } },
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
      },
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

  return `http://localhost:${process.env.PORT ?? "3016"}`.replace(/\/$/, "");
}
