import {
  ACTION_TYPE_GET,
  ACTION_TYPE_POST,
  payloadSchema,
  type SnapAction,
} from "../schemas";
import { decodePayload, verifyJFSRequestBody } from "./verify";
import { z } from "zod";

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
    }
  | {
      type: "origin_mismatch";
      message: string;
    };

export type ParseRequestOptions = {
  /**
   * When true, skip {@link verifyJFSRequestBody} (signature checks).
   */
  skipJFSVerification?: boolean;

  /**
   * Maximum allowed absolute difference between the request timestamp and the
   * server clock, in seconds. Requests outside this window are rejected as
   * potential replays. Defaults to 300 (5 minutes) when not provided.
   */
  maxSkewSeconds?: number;

  /**
   * The origin of the request. Derived from the request when not provided.
   */
  requestOrigin?: string;

};

export type ParseRequestResult =
  | { success: true; action: SnapAction }
  | { success: false; error: ParseRequestError };

const requestBodySchema = z.object({
  header: z.string(),
  payload: z.string(),
  signature: z.string(),
});

/**
 * Parse and validate Farcaster snap requests:
 * - `GET` is allowed for first-page loads and returns `{ type: "get" }`.
 * - `POST`: the body must be JSON in JFS form (`header` / `payload` / `signature`) even if JFS verification is skipped.
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
      action: { type: ACTION_TYPE_GET },
    };
  }

  const maxSkew = options.maxSkewSeconds ?? DEFAULT_SNAP_POST_MAX_SKEW_SECONDS;
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

  // Audience validation: ensure the payload audience matches the server origin.
  let expectedOrigin = options.requestOrigin;
  if (expectedOrigin === undefined) {
    try {
      const url = new URL(request.url);
      const proto =
        request.headers.get("x-forwarded-proto") ??
        url.protocol.replace(":", "");
      const host = request.headers.get("x-forwarded-host") ?? url.host;
      expectedOrigin = `${proto}://${host}`;
    } catch {
      // do nothing
    }
  }

  if (expectedOrigin !== undefined && body.audience !== expectedOrigin) {
    return {
      success: false,
      error: {
        type: "origin_mismatch",
        message: `payload audience "${body.audience}" does not match expected origin "${expectedOrigin}"`,
      },
    };
  }

  return {
    success: true,
    action: {
      type: ACTION_TYPE_POST,
      ...body,
    },
  };
}
