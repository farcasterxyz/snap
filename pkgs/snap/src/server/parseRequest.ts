import {
  ACTION_TYPE_GET,
  ACTION_TYPE_POST,
  payloadSchema,
  type SnapAction,
} from "../schemas";
import {
  decodePayload,
  parsePostJfsEnvelope,
  verifyJFSRequestBody,
} from "./verify";
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
    }
  | {
      type: "fid_mismatch";
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

/**
 * Parse and validate Farcaster snap requests:
 * - `GET` is allowed for first-page loads and returns `{ type: "get" }`.
 * - `POST`: the body must be a JFS envelope — either JSON `{ header, payload, signature }` or the same **compact** string form (`BASE64URL(header).BASE64URL(payload).BASE64URL(signature)`), even if JFS verification is skipped.
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

  const envelopeResult = parsePostJfsEnvelope(text);
  if (!envelopeResult.ok) {
    return {
      success: false,
      error: { type: "invalid_json", message: envelopeResult.error.message },
    };
  }
  const parsed = envelopeResult.envelope;

  const payloadParsed = payloadSchema.safeParse(decodePayload(parsed.payload));
  if (!payloadParsed.success) {
    return {
      success: false,
      error: { type: "validation", issues: payloadParsed.error.issues },
    };
  }

  const body = payloadParsed.data;

  if (!options.skipJFSVerification) {
    const jfs = await verifyJFSRequestBody(parsed);
    if (!jfs.valid) {
      return {
        success: false,
        error: { type: "signature", message: jfs.error.message },
      };
    }
    if (jfs.signingUserFid !== body.user.fid) {
      return {
        success: false,
        error: {
          type: "fid_mismatch",
          message: `JFS header fid "${jfs.signingUserFid}" does not match user.fid "${body.user.fid}"`,
        },
      };
    }
  }

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

  if (body.fid !== undefined && body.fid !== body.user.fid) {
    return {
      success: false,
      error: {
        type: "fid_mismatch",
        message: `fid "${body.fid}" does not match user.fid "${body.user.fid}"`,
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
