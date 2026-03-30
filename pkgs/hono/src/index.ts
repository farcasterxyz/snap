import type { Hono } from "hono";
import { cors } from "hono/cors";
import { MEDIA_TYPE, type SnapFunction } from "@farcaster/snap";
import { parseRequest } from "@farcaster/snap/server";
import { payloadToResponse } from "./payloadToResponse";

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
    "This is a Farcaster Snap server. See https://snap.farcaster.xyz for more info.";

  app.use(path, cors({ origin: "*" }));

  app.get(path, async (c) => {
    const accept = c.req.header("Accept");
    if (!clientWantsSnapResponse(accept)) {
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
