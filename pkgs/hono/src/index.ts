import type { Hono } from "hono";
import { cors } from "hono/cors";
import { MEDIA_TYPE, validatePage, type SnapFunction } from "@farcaster/snap";
import { parseRequest } from "@farcaster/snap/server";
import { payloadToResponse } from "./payloadToResponse";
import { generateOgHtml } from "./og-html";
import { renderSnapPageToPng, type OgRenderOptions } from "./og-image";

export type { OgRenderOptions };

export type OgImageOptions = {
  /** @default 1200 */
  width?: number;
  /** @default 630 */
  height?: number;
  /** `Cache-Control` max-age in seconds. @default 3600 */
  cacheMaxAge?: number;
  /** `Cache-Control` s-maxage in seconds (CDN). @default 86400 */
  sMaxAge?: number;
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
   * Text shown on GET requests from browsers / non-snap clients.
   * @default "This is a Farcaster Snap server."
   */
  fallbackText?: string;

  /**
   * Open Graph HTML for non-snap GET and PNG preview at `{path}/~/og-image`.
   * Set to `false` to restore plain-text fallback only.
   * @default true
   */
  og?: boolean | OgImageOptions;
};

/**
 * Register GET and POST snap handlers on `app` at `options.path` (default `/`).
 *
 * - GET  → calls `snapFn({ action: { type: "get" }, request })` and returns the response.
 * - POST → parses the JFS-shaped JSON body; verifies it via {@link verifyJFSRequestBody} unless
 *          `skipJFSVerification` is true, then calls `snapFn({ action, request })` and returns the response.
 *
 * All parsing, schema validation, signature verification, and error responses
 * are handled automatically. `SnapContext.request` is the raw `Request` so handlers
 * can read query params, headers, or the URL when needed.
 *
 * When {@link SnapHandlerOptions.og} is enabled (default), non-snap GET returns HTML with OG tags
 * and `GET {path}/~/og-image` returns a PNG preview of the first page.
 */
export function registerSnapHandler(
  app: Hono,
  snapFn: SnapFunction,
  options: SnapHandlerOptions = {},
): void {
  const path = options.path ?? "/";
  const fallbackText =
    options.fallbackText ??
    "This is a Farcaster Snap server. See https://snap.farcaster.xyz for more info.";

  app.use(path, cors({ origin: "*" }));

  const og = resolveOgConfig(options.og);
  const ogPath = snapOgImagePath(path);

  if (og) {
    app.use(ogPath, cors({ origin: "*" }));

    app.get(ogPath, async (c) => {
      try {
        const payload = await snapFn({
          action: { type: "get" },
          request: c.req.raw,
        });
        const v = validatePage(payload);
        if (!v.valid) {
          return c.text("invalid snap page", 500);
        }
        const renderOpts: OgRenderOptions = {
          width: og.width,
          height: og.height,
        };
        const { png, etag } = await renderSnapPageToPng(payload.page, renderOpts);
        const quoted = `"${etag}"`;
        const inm = c.req.header("if-none-match");
        if (inm === quoted || inm === etag) {
          return new Response(null, {
            status: 304,
            headers: {
              ETag: quoted,
              "Cache-Control": `public, max-age=${og.cacheMaxAge}, s-maxage=${og.sMaxAge}`,
            },
          });
        }
        return new Response(png as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            ETag: quoted,
            "Cache-Control": `public, max-age=${og.cacheMaxAge}, s-maxage=${og.sMaxAge}`,
          },
        });
      } catch {
        return c.text("failed to render OG image", 500);
      }
    });
  }

  app.get(path, async (c) => {
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
      if (og) {
        try {
          const payload = await snapFn({
            action: { type: "get" },
            request: c.req.raw,
          });
          const v = validatePage(payload);
          if (v.valid) {
            const base = publicBaseUrl(c.req.raw);
            const ogImageUrl = `${base}${ogPath}`;
            const pageUrl = `${base}${path === "/" ? "/" : path.replace(/\/$/, "") || "/"}`;
            const html = generateOgHtml({
              page: payload.page,
              ogImageUrl,
              pageUrl,
              fallbackText,
            });
            return c.html(html, 200, { Vary: "Accept" });
          }
        } catch {
          /* fall through to plain text */
        }
      }
      return c.text(fallbackText, 200, { Vary: "Accept" });
    }

    const response = await snapFn({
      action: { type: "get" },
      request: c.req.raw,
    });
    return payloadToResponse(response);
  });

  app.post(path, async (c) => {
    const raw = c.req.raw;
    const skipJFSVerification =
      options.skipJFSVerification !== undefined
        ? options.skipJFSVerification
        : envSkipJFSVerification();

    const parsed = await parseRequest(raw, { skipJFSVerification });

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
          return c.json({ error: err.message }, 400);
        case "signature":
          return c.json({ error: err.message }, 401);
        default: {
          const _exhaustive: never = err;
          throw new Error(`unexpected parse error: ${String(_exhaustive)}`);
        }
      }
    }

    const response = await snapFn({ action: parsed.action, request: raw });

    return payloadToResponse(response);
  });
}

function resolveOgConfig(
  og: SnapHandlerOptions["og"],
):
  | null
  | {
      width: number;
      height: number;
      cacheMaxAge: number;
      sMaxAge: number;
    } {
  if (og === false) return null;
  const o = typeof og === "object" && og !== null ? og : {};
  return {
    width: o.width ?? 1200,
    height: o.height ?? 630,
    cacheMaxAge: o.cacheMaxAge ?? 3600,
    sMaxAge: o.sMaxAge ?? 86400,
  };
}

function snapOgImagePath(snapPath: string): string {
  const base = snapPath === "/" ? "" : snapPath.replace(/\/$/, "");
  return `${base}/~/og-image`;
}

function publicBaseUrl(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto")?.trim() || "http";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost";
  }
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
