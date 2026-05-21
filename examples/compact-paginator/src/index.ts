import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { registerSnapHandler } from "@farcaster/snap-hono";
import type { SnapElementInput, SnapHandlerResult } from "@farcaster/snap";

const app = new Hono();

registerSnapHandler(app, async (ctx): Promise<SnapHandlerResult> => {
  const base = snapBaseUrlFromRequest(ctx.request);
  const requestUrl = new URL(ctx.request.url);
  const submitted =
    ctx.action.type === "post" &&
    requestUrl.searchParams.get("submitted") === "1";

  return compactPaginatorSnap(base, submitted);
});

export default app;

function compactPaginatorSnap(base: string, submitted: boolean): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "pink" },
    ui: {
      root: "page",
      state: { inputs: {} },
      elements: {
        page: {
          type: "stack",
          children: ["hero", "pager", "actions", "status"],
        },
        hero: {
          type: "image",
          props: {
            url: "https://placehold.co/1200x300/831843/ffffff.png?text=Compact+Snap",
            aspect: "4:1",
            alt: "Compact paginator demo banner",
            title: "Compact paginator",
            subtitle: "Short snap, multiple local pages",
          },
        },
        pager: {
          type: "paginator",
          props: {
            initialPage: 0,
            showControls: false,
            showIndicators: false,
          },
          children: ["overview", "choices"],
        },
        overview: pageStack(
          "overview-title",
          "overview-copy",
          "overview-jump",
          "overview-nav",
        ),
        "overview-title": heading("Custom paginator controls"),
        "overview-copy": caption(
          "The built-in pagination bar is hidden. A normal button and a tappable grid tile both drive local page state.",
          2,
        ),
        "overview-jump": paginatorGrid("Open page 2", "paginator_next"),
        choices: pageStack(
          "choices-title",
          "choice-row",
          "choices-copy",
          "choices-jump",
          "choices-nav",
        ),
        "choices-title": heading("Second page"),
        "choice-row": {
          type: "toggle_group",
          props: {
            name: "choice",
            options: ["Fast", "Small", "Local"],
          },
        },
        "choices-copy": caption(
          "Back uses the same local paginator action path and still does not POST.",
          2,
        ),
        "choices-jump": paginatorGrid("Back to page 1", "paginator_previous"),
        "overview-nav": navStack(["next-page"]),
        "choices-nav": navStack(["previous-page"]),
        "next-page": paginatorButton("Next", "paginator_next", { page: 0 }),
        "previous-page": paginatorButton("Back", "paginator_previous", { page: 0 }),
        actions: {
          type: "stack",
          props: { direction: "horizontal", equalWidth: true },
          children: ["confirm", "reload"],
        },
        confirm: {
          type: "button",
          props: { label: "Confirm", variant: "primary" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/?submitted=1` },
            },
          },
        },
        reload: {
          type: "button",
          props: { label: "Reload" },
          on: {
            press: {
              action: "submit",
              params: { target: `${base}/` },
            },
          },
        },
        status: {
          type: "text",
          props: {
            content: submitted
              ? "POST received from the explicit button."
              : "Paginator controls should not create POSTs.",
            size: "sm",
            align: "center",
          },
        },
      },
    },
  };
}

function pageStack(...children: string[]): SnapElementInput {
  return {
    type: "stack",
    children,
  };
}

function navStack(children: string[]): SnapElementInput {
  return {
    type: "stack",
    props: { direction: "horizontal", equalWidth: true, gap: "sm" },
    children,
  };
}

function paginatorButton(
  label: string,
  action: "paginator_next" | "paginator_previous" | "paginator_go_to",
  params?: Record<string, unknown>,
): SnapElementInput {
  return {
    type: "button",
    props: { label },
    on: {
      press: {
        action,
        params: params ?? {},
      },
    },
  };
}

function paginatorGrid(
  label: string,
  action: "paginator_next" | "paginator_previous",
): SnapElementInput {
  return {
    type: "cell_grid",
    props: {
      rows: 1,
      cols: 1,
      gap: "none",
      rowHeight: 36,
      cells: [{ row: 0, col: 0, color: "pink", content: label }],
    },
    on: {
      press: {
        action,
        params: {},
      },
    },
  };
}

function heading(content: string): SnapElementInput {
  return {
    type: "text",
    props: { content, weight: "bold" },
  };
}

function caption(content: string, maxLines = 1): SnapElementInput {
  return {
    type: "text",
    props: { content, size: "sm", maxLines },
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

  return `http://localhost:${process.env.PORT ?? "3025"}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3025);
  serve({ fetch: app.fetch, port });
  console.log(`compact-paginator running on http://localhost:${port}`);
}
