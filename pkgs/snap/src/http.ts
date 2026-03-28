import { MEDIA_TYPE, SPEC_VERSION } from "./constants";
import { verifyJFSRequestBody } from "./verify";
import {
  postRequestBodySchema,
  rootSchema,
  type SnapAction,
  type SnapResponse,
  type SnapPage,
} from "./schemas";
import { validatePage } from "./validator";
import type { z } from "zod";

/** Default replay window per SPEC.md § Replay Protection (5 minutes). */
const DEFAULT_SNAP_POST_MAX_SKEW_SECONDS = 300 as const;

export type ParseRequestError =
  | {
      type: "method_not_allowed";
      message: string;
    }
  | {
      type: "invalid_json";
      message: string;
    }
  | {
      type: "validation";
      issues: z.core.$ZodIssue[];
    }
  | {
      type: "replay";
      message: string;
    }
  | {
      type: "signature";
      message: string;
    };

export type ParseRequestOptions = {
  /**
   * When true, accept plain JSON POST bodies without JFS verification (local dev only).
   * When false (default), the body must be JSON `{ header, payload, signature }` verified via
   * {@link verifyJFSRequestBody}.
   */
  bypassSignatureVerification?: boolean;
};

export type ParseRequestResult =
  | { ok: true; action: SnapAction }
  | { ok: false; error: ParseRequestError };

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function normalizeToRoot(payload: unknown): unknown {
  if (isRecord(payload) && "version" in payload && "page" in payload) {
    return payload;
  }
  return { version: SPEC_VERSION, page: payload };
}

/**
 * Parse and validate Farcaster snap requests:
 * - `GET` is allowed for first-page loads and returns `{ type: "get" }`.
 * - `POST`: by default the body is JSON JFS (`header` / `payload` / `signature`) verified with
 *   {@link verifyJFSRequestBody}; with `bypassSignatureVerification`, accepts plain action JSON (dev only).
 */
export async function parseRequest(
  request: Request,
  options: ParseRequestOptions = {},
): Promise<ParseRequestResult> {
  if (!["GET", "POST"].includes(request.method)) {
    return {
      ok: false,
      error: {
        type: "method_not_allowed",
        message: `expected POST, received ${request.method}`,
      },
    };
  }

  if (request.method === "GET") {
    return {
      ok: true,
      action: { type: "get" },
    };
  }

  const text = await request.text();
  const maxSkew = DEFAULT_SNAP_POST_MAX_SKEW_SECONDS;
  const nowSec = Math.floor(Date.now() / 1000);

  const finishPostJson = (json: unknown): ParseRequestResult => {
    const parsed = postRequestBodySchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        error: { type: "validation", issues: parsed.error.issues },
      };
    }
    const body = parsed.data;
    if (Math.abs(nowSec - body.timestamp) > maxSkew) {
      return {
        ok: false,
        error: {
          type: "replay",
          message: `timestamp outside allowed skew of ${maxSkew}s`,
        },
      };
    }
    return {
      ok: true,
      action: {
        type: "post",
        fid: body.fid,
        inputs: body.inputs,
        buttonIndex: body.button_index,
        timestamp: body.timestamp,
      },
    };
  };

  if (options.bypassSignatureVerification) {
    let json: unknown;
    try {
      json = JSON.parse(text.trim());
    } catch {
      return {
        ok: false,
        error: {
          type: "invalid_json",
          message: "request body is not valid JSON",
        },
      };
    }
    return finishPostJson(json);
  }

  const jfs = await verifyJFSRequestBody(text);
  if (!jfs.valid) {
    return {
      ok: false,
      error: {
        type: "signature",
        message: jfs.error.message,
      },
    };
  }

  return finishPostJson(jfs.data);
}

export type SendResponseOptions = ResponseInit & {
  /** When false, invalid pages return 500 instead of 400. Default true. */
  clientErrorOnInvalid?: boolean;
};

/**
 * Validate a snap root or bare `page` object, then return a JSON Response for the client.
 * Sets `Content-Type: application/json+farcaster-snap`.
 *
 * On validation failure returns JSON `{ "error": "...", "issues": [...] }` with status 400 or 500.
 */
export function sendResponse(
  payload: SnapResponse | SnapPage,
  init?: SendResponseOptions,
): Response {
  const rootUnknown = normalizeToRoot(payload);
  const validation = validatePage(rootUnknown);
  const clientError = init?.clientErrorOnInvalid !== false;
  const status = init?.status;

  if (!validation.valid) {
    const errStatus = clientError ? 400 : 500;
    return new Response(
      JSON.stringify({
        error: clientError
          ? "invalid snap page"
          : "server produced an invalid snap page",
        issues: validation.issues,
      }),
      {
        status: status ?? errStatus,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...normalizeHeaders(init?.headers),
        },
      },
    );
  }

  const finalized = rootSchema.parse(rootUnknown);
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", `${MEDIA_TYPE}; charset=utf-8`);

  return new Response(JSON.stringify(finalized), {
    ...init,
    status: status ?? init?.status ?? 200,
    headers,
  });
}

function normalizeHeaders(h: HeadersInit | undefined): Record<string, string> {
  if (h === undefined) return {};
  const out: Record<string, string> = {};
  new Headers(h).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
