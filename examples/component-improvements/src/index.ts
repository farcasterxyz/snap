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

  return componentImprovementsPage(base, submitted);
});

export default app;

function componentImprovementsPage(
  base: string,
  submitted: boolean,
): SnapHandlerResult {
  return {
    version: "2.0",
    theme: { accent: "teal" },
    ui: {
      root: "page",
      state: { inputs: {} },
      elements: {
        page: {
          type: "stack",
          children: ["banner", "pager", "actions", "status"],
        },
        banner: {
          type: "image",
          props: {
            url: "https://placehold.co/1200x300/0f766e/ffffff.png?text=NEYN-11381",
            aspect: "4:1",
            alt: "Compact teal NEYN-11381 banner",
            title: "NEYN-11381 showcase",
            subtitle: "Paginator, image overlays, compact copy, dense grids",
          },
        },
        pager: {
          type: "paginator",
          props: {
            initialPage: 0,
            showControls: true,
            showIndicators: true,
          },
          children: [
            "overview",
            "copy",
            "grid",
            "custom-nav",
            "image-card",
            "many-pages",
            "limits",
            "finish",
          ],
        },
        overview: pageStack(
          "overview-title",
          "overview-copy",
          "overview-short",
          "overview-next",
        ),
        "overview-title": heading("Visible paginator"),
        "overview-copy": caption(
          "This example keeps the built-in controls and indicators visible while also using custom local actions inside pages.",
          2,
        ),
        "overview-short": caption(
          "Default text is one line, so this deliberately long sentence should clamp instead of growing the snap.",
        ),
        "overview-next": paginatorButton("Jump to copy", "paginator_go_to", {
          page: 1,
        }),
        copy: pageStack("copy-title", "copy-one-line", "copy-two-lines"),
        "copy-title": heading("Text clamping"),
        "copy-one-line": caption(
          "No maxLines prop here: this long piece of supporting copy should stay to a single visible line by default.",
        ),
        "copy-two-lines": caption(
          "This text opts into maxLines: 2, giving longer explanatory copy a little more room without letting the snap become tall.",
          2,
        ),
        grid: pageStack("grid-title", "grid-copy", "dense-grid", "grid-next"),
        "grid-title": heading("Dense 1:1 grid"),
        "grid-copy": caption(
          "Square cells keep board-like layouts compact and predictable.",
        ),
        "dense-grid": {
          type: "cell_grid",
          props: {
            cols: 6,
            rows: 3,
            cellAspectRatio: "square",
            gap: "sm",
            cells: denseGridCells(),
          },
        },
        "grid-next": paginatorButton("Custom next", "paginator_next"),
        "custom-nav": pageStack(
          "custom-nav-title",
          "custom-nav-copy",
          "custom-nav-row",
        ),
        "custom-nav-title": heading("Custom local controls"),
        "custom-nav-copy": caption(
          "Buttons inside the active page can move the paginator locally without POSTing.",
          2,
        ),
        "custom-nav-row": {
          type: "stack",
          props: { direction: "horizontal", equalWidth: true, gap: "sm" },
          children: ["custom-prev", "custom-next"],
        },
        "custom-prev": paginatorButton("Back", "paginator_previous"),
        "custom-next": paginatorButton("Forward", "paginator_next"),
        "image-card": pageStack("image-card-title", "image-card-image"),
        "image-card-title": heading("Overlay image card"),
        "image-card-image": {
          type: "image",
          props: {
            url: "https://placehold.co/1200x300/115e59/ffffff.png?text=4%3A1+Overlay",
            aspect: "4:1",
            alt: "4:1 card with overlay text",
            title: "Image props, not hero",
            subtitle: "Title and subtitle live on image",
          },
        },
        "many-pages": pageStack("many-pages-title", "many-pages-copy"),
        "many-pages-title": heading("More than six pages"),
        "many-pages-copy": caption(
          "Paginator pages can exceed the normal per-container child count while the global element cap still applies.",
          2,
        ),
        limits: pageStack("limits-title", "limits-copy", "limits-back"),
        "limits-title": heading("Validation stays strict"),
        "limits-copy": caption(
          "The local page index never becomes a POST input, and snap-level limits still protect the whole tree.",
          2,
        ),
        "limits-back": paginatorButton("Go to first", "paginator_go_to", {
          page: 0,
        }),
        finish: pageStack("finish-title", "finish-copy"),
        "finish-title": heading("Compact actions"),
        "finish-copy": caption(
          "The shorter button height and restored gaps should feel compact without crowding the layout.",
          2,
        ),
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
              ? "POST received from the explicit action row."
              : "Paginator movement should stay local; only Confirm/Reload POST.",
            size: "sm",
            align: "center",
            maxLines: 2,
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

function heading(content: string): SnapElementInput {
  return {
    type: "text",
    props: { content, weight: "bold" },
  };
}

function caption(content: string, maxLines?: number): SnapElementInput {
  return {
    type: "text",
    props: {
      content,
      size: "sm",
      ...(maxLines !== undefined ? { maxLines } : {}),
    },
  };
}

function paginatorButton(
  label: string,
  action: "paginator_next" | "paginator_previous" | "paginator_go_to",
  params: Record<string, unknown> = {},
): SnapElementInput {
  return {
    type: "button",
    props: { label },
    on: {
      press: {
        action,
        params,
      },
    },
  };
}

function denseGridCells(): Array<{
  row: number;
  col: number;
  color: string;
  content: string;
}> {
  return Array.from({ length: 18 }, (_, index) => ({
    row: Math.floor(index / 6),
    col: index % 6,
    color: index % 2 === 0 ? "teal" : "#99f6e4",
    content: String(index + 1),
  }));
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3024);
  serve({ fetch: app.fetch, port });
  console.log(`component-improvements running on http://localhost:${port}`);
}
