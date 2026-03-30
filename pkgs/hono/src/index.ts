import type { Hono } from "hono";
import { cors } from "hono/cors";
import { MEDIA_TYPE, type SnapFunction } from "@farcaster/snap";
import { parseRequest } from "@farcaster/snap/server";
import { payloadToResponse, snapHeaders } from "./payloadToResponse";

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
   * Visible message in the HTML page served on GET when the client does not request snap JSON.
   * @default "This is a Farcaster Snap server."
   */
  fallbackText?: string;
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
 */
export function registerSnapHandler(
  app: Hono,
  snapFn: SnapFunction,
  options: SnapHandlerOptions = {},
): void {
  const path = options.path ?? "/";
  const fallbackText =
    options.fallbackText ??
    "This is a Farcaster Snap server. See <a href='https://snap.farcaster.xyz'>snap.farcaster.xyz</a> for more info.";

  app.use(path, cors({ origin: "*" }));

  app.get(path, async (c) => {
    const resourcePath = resourcePathFromRequest(c.req.url);
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
      return new Response(fallbackHtmlDocument(fallbackText), {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fallbackHtmlDocument(message: string): string {
  const body = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Farcaster Snap</title>
</head>
<body>
<p>${body}</p>
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
