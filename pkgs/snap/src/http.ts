import { MEDIA_TYPE, SPEC_VERSION } from "./constants";
import { decodePayload, verifyJFSRequestBody } from "./verify";
import {
  payloadSchema,
  rootSchema,
  type SnapAction,
  type SnapResponse,
  type SnapPage,
} from "./schemas";
import { validatePage } from "./validator";
import { z } from "zod";

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
   * When true, skip JFS verification of JSON POST bodies.
   * When false (default), the body must be JSON `{ header, payload, signature }` verified via
   * {@link verifyJFSRequestBody}.
   */
  skipJFSVerification?: boolean;
};

export type ParseRequestResult =
  | { success: true; action: SnapAction }
  | { success: false; error: ParseRequestError };

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function normalizeToRoot(payload: unknown): unknown {
  if (isRecord(payload) && "version" in payload && "page" in payload) {
    return payload;
  }
  return { version: SPEC_VERSION, page: payload };
}

const requestBodySchema = z.object({
  header: z.string(),
  payload: z.string(),
  signature: z.string(),
});

/**
 * Parse and validate Farcaster snap requests:
 * - `GET` is allowed for first-page loads and returns `{ type: "get" }`.
 * - `POST`: by default the body is JSON JFS (`header` / `payload` / `signature`) verified with
 *   {@link verifyJFSRequestBody}; with `skipJFSVerification`, accepts plain action JSON (dev only).
 */
export async function parseRequest(
  request: Request,
  options: ParseRequestOptions = {},
): Promise<ParseRequestResult> {
  if (!["GET", "POST"].includes(request.method)) {
    return {
      success: false,
      error: {
        type: "method_not_allowed",
        message: `expected POST, received ${request.method}`,
      },
    };
  }

  if (request.method === "GET") {
    return {
      success: true,
      action: { type: "get" },
    };
  }

  const maxSkew = DEFAULT_SNAP_POST_MAX_SKEW_SECONDS;
  const nowSec = Math.floor(Date.now() / 1000);

  const text = await request.text();

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(text);
  } catch {
    return {
      success: false,
      error: {
        type: "invalid_json",
        message: "request body is not valid JSON",
      },
    };
  }

  const parsed = requestBodySchema.safeParse(jsonBody);
  if (!parsed.success) {
    return {
      success: false,
      error: { type: "invalid_json", message: parsed.error.message },
    };
  }

  if (!options.skipJFSVerification) {
    const jfs = await verifyJFSRequestBody(parsed.data);
    if (!jfs.valid) {
      return {
        success: false,
        error: { type: "signature", message: jfs.error.message },
      };
    }
  }

  const payloadParsed = payloadSchema.safeParse(
    decodePayload(parsed.data.payload),
  );
  if (!payloadParsed.success) {
    return {
      success: false,
      error: { type: "validation", issues: payloadParsed.error.issues },
    };
  }

  const body = payloadParsed.data;
  if (Math.abs(nowSec - body.timestamp) > maxSkew) {
    return {
      success: false,
      error: {
        type: "replay",
        message: `timestamp outside allowed skew of ${maxSkew}s`,
      },
    };
  }
  return {
    success: true,
    action: {
      type: "post",
      fid: body.fid,
      inputs: body.inputs,
      buttonIndex: body.button_index,
      timestamp: body.timestamp,
    },
  };
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
