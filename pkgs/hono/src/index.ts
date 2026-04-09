import type { Hono } from "hono";
import { cors } from "hono/cors";
import {
  MEDIA_TYPE,
  type SnapFunction,
  ACTION_TYPE_GET,
} from "@farcaster/snap";
import { parseRequest } from "@farcaster/snap/server";
import { brandedFallbackHtml } from "./fallback";
import { payloadToResponse, snapHeaders } from "./payloadToResponse";
import { renderSnapPage } from "./renderSnapPage";
import {
  renderSnapPageToPng,
  renderWithDedup,
  etagForPage,
  type OgOptions,
} from "./og-image";

export type SnapOpenGraphMeta = {
  title?: string;
  description?: string;
};

export type SnapHandlerOptions = {
  /**
   * Route path to register GET and POST handlers on.
   * @default "/"
   */
  path?: string;

  /**
   * When true, skip JFS signature verification only. POST bodies must still be JFS-shaped JSON.
   * When omitted, default to {@link envSkipJFSVerification}.
   */
  skipJFSVerification?: boolean;

  /**
   * Raw HTML string for the browser fallback page. When set, takes precedence
   * over the default branded fallback.
   */
  fallbackHtml?: string;

  /**
   * Open Graph title/description overrides for the HTML fallback page meta tags
   * (and document title). When a field is omitted, the usual extraction from snap
   * UI or branded defaults applies.
   */
  openGraph?: SnapOpenGraphMeta;

  /**
   * Open Graph configuration. Set to `false` to disable OG tag injection and
   * the `/~/og-image` route. Pass an `OgOptions` object to customize rendering.
   * @default true
   */
  og?: boolean | OgOptions;
};

/**
 * Register GET and POST snap handlers on `app` at `options.path` (default `/`).
 *
 * - GET  → calls `snapFn(ctx)` with `ctx.action.type === "get"` and returns the response.
 * - POST → parses the JFS-shaped JSON body; verifies it via {@link verifyJFSRequestBody} unless
 *          `skipJFSVerification` is true, then calls `snapFn(ctx)` with the parsed post action and returns the response.
 *
 * All parsing, schema validation, signature verification, and error responses
 * are handled automatically. `ctx.request` is the raw `Request` so handlers
 * can read query params, headers, or the URL when needed.
 */
export function registerSnapHandler(
  app: Hono,
  snapFn: SnapFunction,
  options: SnapHandlerOptions = {},
): void {
  const path = options.path ?? "/";
  const ogEnabled = options.og !== false;
  const ogOptions =
    typeof options.og === "object" ? options.og : ogEnabled ? {} : undefined;

  app.use(path, cors({ origin: "*" }));

  // ─── /~/og-image PNG route ────────────────────────────
  if (ogEnabled && ogOptions) {
    const imgPath = ogImagePath(path);

    app.get(imgPath, async (c) => {
      const resourcePath = resourcePathFromRequest(c.req.url);
      const key = resourcePath;

      const renderFn = async (): Promise<{ png: Uint8Array; etag: string }> => {
        const snap = await snapFn({
          action: { type: ACTION_TYPE_GET },
          request: stripAuthHeaders(c.req.raw),
        });
        const snapJson = JSON.stringify(snap);
        const etag = etagForPage(snapJson);
        const t0 = Date.now();
        const png = await renderSnapPageToPng(snap, ogOptions);
        const elapsed = Date.now() - t0;
        return { png, etag, elapsed } as { png: Uint8Array; etag: string } & {
          elapsed: number;
        };
      };

      try {
        // Adapter cache check
        const adapter = ogOptions.cache;
        if (adapter) {
          const hit = await adapter.get(key);
          if (hit) {
            return new Response(hit.png as BodyInit, {
              status: 200,
              headers: {
                "Content-Type": "image/png",
                ETag: hit.etag,
                "X-OG-Cache": "HIT",
                ...ogCacheHeaders(ogOptions),
              },
            });
          }
        }

        const result = await renderWithDedup(key, async () => {
          const r = await renderFn();
          return r;
        });

        const { png, etag } = result;
        const elapsed = (result as typeof result & { elapsed?: number })
          .elapsed;

        if (adapter) {
          await adapter
            .set(key, { png, etag }, ogOptions.cdnMaxAge ?? 86400)
            .catch(() => undefined);
        }

        return new Response(png as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            ETag: etag,
            "X-OG-Cache": "MISS",
            ...(elapsed != null ? { "X-OG-Render-Ms": String(elapsed) } : {}),
            ...ogCacheHeaders(ogOptions),
          },
        });
      } catch {
        return new Response(null, {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        });
      }
    });
  }

  // ─── Main snap route ───────────────────────────────────
  app.get(path, async (c) => {
    const resourcePath = resourcePathFromRequest(c.req.url);
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
      const fallbackHtml =
        options.fallbackHtml ??
        (await getFallbackHtml(
          c.req.raw,
          snapFn,
          ogEnabled ? buildOgImageUrl(c.req.raw, path) : undefined,
          options.openGraph,
        ));
      return new Response(fallbackHtml, {
        status: 200,
        headers: snapHeaders(resourcePath, "text/html", [
          MEDIA_TYPE,
          "text/html",
        ]),
      });
    }

    const response = await snapFn({
      action: { type: ACTION_TYPE_GET },
      request: c.req.raw,
    });

    return payloadToResponse(response, {
      resourcePath,
      mediaTypes: [MEDIA_TYPE, "text/html"],
    });
  });

  app.post(path, async (c) => {
    const raw = c.req.raw;
    const skipJFSVerification =
      options.skipJFSVerification !== undefined
        ? options.skipJFSVerification
        : envSkipJFSVerification();

    const parsed = await parseRequest(raw, {
      skipJFSVerification,
      requestOrigin: snapOriginFromRequest(raw),
    });

    if (!parsed.success) {
      const err = parsed.error;
      switch (err.type) {
        case "method_not_allowed":
          return c.json({ error: err.message }, 405);
        case "invalid_json":
          return c.json({ error: err.message }, 400);
        case "validation":
          return c.json(
            { error: "invalid POST body", issues: err.issues },
            400,
          );
        case "replay":
        case "origin_mismatch":
          return c.json({ error: err.message }, 400);
        case "signature":
          return c.json({ error: err.message }, 401);
        default: {
          const _exhaustive: never = err;
          throw new Error(`unexpected parse error: ${String(_exhaustive)}`);
        }
      }
    }

    const response = await snapFn({
      action: parsed.action,
      request: raw,
    });

    return payloadToResponse(response, {
      resourcePath: resourcePathFromRequest(raw.url),
      mediaTypes: [MEDIA_TYPE, "text/html"],
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────

function ogImagePath(snapPath: string): string {
  const p = snapPath.replace(/\/+$/, "") || "/";
  return p === "/" ? "/~/og-image" : `${p}/~/og-image`;
}

function buildOgImageUrl(request: Request, snapPath: string): string {
  const origin = snapOriginFromRequest(request);
  return origin + ogImagePath(snapPath);
}

function ogCacheHeaders(
  opts: import("./og-image").OgOptions,
): Record<string, string> {
  const cdnMaxAge = opts.cdnMaxAge ?? 86400;
  const browserMaxAge = opts.browserMaxAge ?? 60;
  return {
    "Cache-Control": `public, max-age=${browserMaxAge}, s-maxage=${cdnMaxAge}, stale-while-revalidate=604800`,
  };
}

function stripAuthHeaders(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  return new Request(request.url, { method: request.method, headers });
}

function resourcePathFromRequest(url: string): string {
  const u = new URL(url);
  return u.pathname + u.search;
}

async function getFallbackHtml(
  request: Request,
  snapFn: SnapFunction,
  ogImageUrl?: string,
  openGraph?: SnapOpenGraphMeta,
): Promise<string> {
  const origin = snapOriginFromRequest(request);
  const siteName =
    process.env.SNAP_OG_SITE_NAME?.trim() ||
    process.env.OG_SITE_NAME?.trim() ||
    undefined;
  const resourcePath = resourcePathFromRequest(request.url);

  try {
    const snap = await snapFn({
      action: { type: ACTION_TYPE_GET },
      request: stripAuthHeaders(request),
    });
    return renderSnapPage(snap, origin, {
      ogImageUrl,
      resourcePath,
      siteName,
      openGraph,
    });
  } catch {
    return brandedFallbackHtml(origin, {
      ogImageUrl,
      resourcePath,
      siteName,
      title: openGraph?.title,
      description: openGraph?.description,
    });
  }
}

function snapOriginFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      return fromEnv.replace(/\/$/, "");
    }
  }

  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`;
}

function clientWantsSnapResponse(accept: string | undefined): boolean {
  if (!accept || accept.trim() === "") return false;
  const want = MEDIA_TYPE.toLowerCase();
  for (const part of accept.split(",")) {
    const media = part.trim().split(";")[0]?.trim().toLowerCase();
    if (media === want) return true;
  }
  return false;
}

function envSkipJFSVerification(): boolean {
  const v = process.env.SKIP_JFS_VERIFICATION?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  return false;
}
