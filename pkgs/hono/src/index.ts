import type { Hono } from "hono";
import { cors } from "hono/cors";
import { MEDIA_TYPE, type SnapFunction } from "@farcaster/snap";
import { parseRequest } from "@farcaster/snap/server";
import { payloadToResponse, snapHeaders } from "./payloadToResponse";
import { renderSnapPage } from "./renderSnapPage";

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

  app.use(path, cors({ origin: "*" }));

  app.get(path, async (c) => {
    const resourcePath = resourcePathFromRequest(c.req.url);
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
      const fallbackHtml =
        options.fallbackHtml ?? (await getFallbackHtml(c.req.raw, snapFn));
      return new Response(fallbackHtml, {
        status: 200,
        headers: snapHeaders(resourcePath, "text/html", [
          MEDIA_TYPE,
          "text/html",
        ]),
      });
    }

    const response = await snapFn({
      action: { type: "get" },
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

    return payloadToResponse(response, {
      resourcePath: resourcePathFromRequest(raw.url),
      mediaTypes: [MEDIA_TYPE, "text/html"],
    });
  });
}

function resourcePathFromRequest(url: string): string {
  const u = new URL(url);
  return u.pathname + u.search;
}

async function getFallbackHtml(
  request: Request,
  snapFn: SnapFunction,
): Promise<string> {
  try {
    const snap = await snapFn({
      action: { type: "get" },
      request,
    });
    return renderSnapPage(snap, snapOriginFromRequest(request));
  } catch {
    return brandedFallbackHtml(snapOriginFromRequest(request));
  }
}

const FARCASTER_ICON_SVG = `<svg aria-hidden="true" focusable="false" viewBox="0 0 520 457" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M519.801 0V61.6809H458.172V123.31H477.054V123.331H519.801V456.795H416.57L416.507 456.49L363.832 207.03C358.81 183.251 345.667 161.736 326.827 146.434C307.988 131.133 284.255 122.71 260.006 122.71H259.8C235.551 122.71 211.818 131.133 192.979 146.434C174.139 161.736 160.996 183.259 155.974 207.03L103.239 456.795H0V123.323H42.7471V123.31H61.6262V61.6809H0V0H519.801Z" fill="currentColor"/></svg>`;

function snapOriginFromRequest(request: Request): string {
  const fromEnv = process.env.SNAP_PUBLIC_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  return "https://snap.farcaster.xyz";
}

function brandedFallbackHtml(snapOrigin: string): string {
  const snapUrl = encodeURIComponent(snapOrigin + "/");
  const testUrl = `https://farcaster.xyz/~/developers/snaps?url=${snapUrl}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Farcaster Snap</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0A0A0A;color:#FAFAFA;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center;max-width:400px;padding:48px 32px}
.logo{color:#8B5CF6;margin-bottom:24px}
.logo svg{width:48px;height:42px}
h1{font-size:24px;font-weight:700;margin-bottom:8px}
p{color:#A1A1AA;font-size:15px;line-height:1.5;margin-bottom:32px}
.btns{display:flex;flex-direction:column;gap:12px}
a{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;transition:opacity .15s}
a:hover{opacity:.85}
.p{background:#8B5CF6;color:#fff}
.s{background:#1A1A2E;color:#FAFAFA;border:1px solid #2D2D44}
.s svg{width:20px;height:18px}
</style>
</head>
<body>
<div class="c">
<div class="logo">${FARCASTER_ICON_SVG}</div>
<h1>Farcaster Snap</h1>
<p>This is a Farcaster Snap &mdash; an interactive embed that lives in the feed.</p>
<div class="btns">
<a href="${testUrl}" class="p">Test this snap</a>
<a href="https://farcaster.xyz" class="s">${FARCASTER_ICON_SVG} Sign up for Farcaster</a>
</div>
</div>
</body>
</html>`;
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
