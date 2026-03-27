import type { Hono } from "hono";
import {
  parseRequest,
  sendResponse,
  MEDIA_TYPE,
  type ParseRequestOptions,
  type SnapFunction,
} from "@farcaster/snap";

export type { SnapContext, SnapFunction } from "@farcaster/snap";

export type SnapHandlerOptions = {
  /**
   * Route path to register GET and POST handlers on.
   * @default "/"
   */
  path?: string;

  /**
   * When true, skip JFS verification and accept plain JSON POST bodies.
   * Useful for local development. Default false.
   */
  bypassSignatureVerification?: boolean;

  /**
   * Max age / future skew for POST `timestamp` (unix seconds).
   * @default 300
   */
  maxSkewSeconds?: number;

  /**
   * Text shown on GET requests from browsers / non-snap clients.
   * @default "This is a Farcaster Snap server."
   */
  fallbackText?: string;
};

/**
 * Register GET and POST snap handlers on `app` at `options.path` (default `/`).
 *
 * - GET  → calls `snapFn({ action: { type: "get" }, request })` and returns the response.
 * - POST → parses the request, verifies the JFS body via {@link verifyJFSRequestBody},
 *          calls `snapFn({ action, request })`, and returns the response.
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
    "This is a Farcaster Snap server. See https://snap.farcaster.xyz for more info.";

  app.get(path, async (c) => {
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
      return c.text(fallbackText, 200);
    }

    const response = await snapFn({
      action: { type: "get" },
      request: c.req.raw,
    });
    return sendResponse(response);
  });

  app.post(path, async (c) => {
    const raw = c.req.raw;
    const parseOpts: ParseRequestOptions = {
      ...(options.bypassSignatureVerification !== undefined
        ? { bypassSignatureVerification: options.bypassSignatureVerification }
        : {}),
      ...(options.maxSkewSeconds !== undefined
        ? { maxSkewSeconds: options.maxSkewSeconds }
        : {}),
    };

    const parsed = await parseRequest(raw, parseOpts);

    if (!parsed.ok) {
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

    return sendResponse(response);
  });
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
