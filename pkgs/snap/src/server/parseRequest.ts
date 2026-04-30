import { z } from "zod";
import {
  ACTION_TYPE_GET,
  ACTION_TYPE_POST,
  getPayloadSchema,
  payloadSchema,
  type SnapAction,
  type SnapPayload,
  type SnapGetPayload,
} from "../schemas";
import { decodePayload, parseJfs, verifyJFS } from "./verify";
import { SNAP_PAYLOAD_HEADER } from "../constants";

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
 * - `GET`: returns `{ type: "get" }`, or optional viewer fields when `X-Snap-Payload`
 *   carries a JFS compact string whose decoded payload validates against {@link getPayloadSchema}.
 * - `POST`: the body must be a JFS envelope — either JSON `{ header, payload, signature }` or the same **compact** string form as GET (`BASE64URL(header).BASE64URL(payload).BASE64URL(signature)`), even if JFS verification is skipped.
 */
export async function parseRequest(
  request: Request,
  options: ParseRequestOptions = {},
): Promise<ParseRequestResult> {
  if (request.method === "GET") {
    return await parseGetRequest(request, options);
  }
  if (request.method === "POST") {
    return await parsePostRequest(request, options);
  }
  return {
    success: false,
    error: {
      type: "method_not_allowed",
      message: `expected GET or POST, received ${request.method}`,
    },
  };
}

async function parseGetRequest(
  request: Request,
  options: ParseRequestOptions,
): Promise<ParseRequestResult> {
  const compactHeader = request.headers.get(SNAP_PAYLOAD_HEADER)?.trim();
  if (!compactHeader) {
    return { success: true, action: { type: ACTION_TYPE_GET } };
  }

  const result = await validateJfsPayload({
    jfsText: compactHeader,
    schema: getPayloadSchema,
    request,
    options,
    invalidJsonMessage: `${SNAP_PAYLOAD_HEADER} must be a valid JFS compact string`,
  });
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    action: { type: ACTION_TYPE_GET, ...result.payload },
  };
}

async function parsePostRequest(
  request: Request,
  options: ParseRequestOptions,
): Promise<ParseRequestResult> {
  const result = await validateJfsPayload({
    jfsText: await request.text(),
    schema: payloadSchema,
    request,
    options,
  });
  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const payload = result.payload;
  if (payload.fid !== undefined && payload.fid !== payload.user.fid) {
    return {
      success: false,
      error: {
        type: "fid_mismatch",
        message: `fid "${payload.fid}" does not match user.fid "${payload.user.fid}"`,
      },
    };
  }

  return {
    success: true,
    action: { type: ACTION_TYPE_POST, ...payload },
  };
}

/**
 * Shared pipeline for authenticated snap requests: parse the JFS envelope,
 * decode and schema-validate the payload, optionally verify the JFS signature
 * against an active hub signer (matching `user.fid`), then check timestamp
 * skew and that `audience` matches the request origin.
 *
 * Both GET (payload header) and POST (request body) feed into this.
 */
async function validateJfsPayload<T extends SnapPayload | SnapGetPayload>({
  jfsText,
  schema,
  request,
  options,
  invalidJsonMessage,
}: {
  jfsText: string;
  schema: z.ZodType<T>;
  request: Request;
  options: ParseRequestOptions;
  invalidJsonMessage?: string;
}): Promise<
  { ok: true; payload: T } | { ok: false; error: ParseRequestError }
> {
  const parsed = parseJfs(jfsText);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        type: "invalid_json",
        message: invalidJsonMessage ?? parsed.error,
      },
    };
  }
  const jfs = parsed.jfs;

  const payloadParsed = schema.safeParse(decodePayload(jfs.payload));
  if (!payloadParsed.success) {
    return {
      ok: false,
      error: { type: "validation", issues: payloadParsed.error.issues },
    };
  }
  const payload = payloadParsed.data;

  if (!options.skipJFSVerification) {
    const verified = await verifyJFS(jfs);
    if (!verified.valid) {
      return {
        ok: false,
        error: { type: "signature", message: verified.error.message },
      };
    }
    if (verified.signingUserFid !== payload.user.fid) {
      return {
        ok: false,
        error: {
          type: "fid_mismatch",
          message: `JFS header fid "${verified.signingUserFid}" does not match user.fid "${payload.user.fid}"`,
        },
      };
    }
  }

  const maxSkew = options.maxSkewSeconds ?? DEFAULT_SNAP_POST_MAX_SKEW_SECONDS;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - payload.timestamp) > maxSkew) {
    return {
      ok: false,
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

  if (expectedOrigin !== undefined && payload.audience !== expectedOrigin) {
    return {
      ok: false,
      error: {
        type: "origin_mismatch",
        message: `payload audience "${payload.audience}" does not match expected origin "${expectedOrigin}"`,
      },
    };
  }

  return { ok: true, payload };
}
