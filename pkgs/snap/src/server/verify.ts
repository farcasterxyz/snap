import {
  decode,
  decodePayload as jfsDecodePayload,
  encodePayload as jfsEncodePayload,
  toJsonFarcasterSignature,
  verify,
  type DecodedJsonFarcasterSignature,
  type JsonFarcasterSignature,
} from "@farcaster/jfs";
import { hexToBytes, type Hex } from "viem";
import {
  DEFAULT_SNAP_HUB_HTTP_BASE_URL,
  getActiveEd25519SignerKeysFromHubHttp,
} from "./hubs";

/** Wire format for a JFS request (same as {@link JsonFarcasterSignature}). */
export type JfsRequestEnvelope = JsonFarcasterSignature;

/**
 * Normalize a compact JFS string to `{ header, payload, signature }` using
 * `@farcaster/jfs` {@link toJsonFarcasterSignature} (which delegates to `uncompact` for strings).
 * Returns null if the string is malformed.
 */
export function tryUncompactJfsString(value: string): JfsRequestEnvelope | null {
  try {
    return toJsonFarcasterSignature(value.trim());
  } catch {
    return null;
  }
}

/**
 * Fully decode a JFS envelope or compact string via `@farcaster/jfs` {@link decode}:
 * parsed header object, parsed payload, signature bytes.
 */
export function tryDecodeJfs<TPayload>(
  input: JsonFarcasterSignature | string,
): DecodedJsonFarcasterSignature<TPayload> | null {
  try {
    return decode<TPayload>(input);
  } catch {
    return null;
  }
}

function isJfsEnvelopeJson(v: unknown): v is JfsRequestEnvelope {
  if (v === null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.header === "string" &&
    typeof o.payload === "string" &&
    typeof o.signature === "string"
  );
}

export type ParsePostJfsEnvelopeError = {
  message: string;
};

/**
 * Parse a POST body as a JFS envelope: JSON `{ header, payload, signature }`, or the same
 * compact string form (see {@link toJsonFarcasterSignature} / `uncompact`).
 */
export function parsePostJfsEnvelope(
  text: string,
):
  | { ok: true; envelope: JfsRequestEnvelope }
  | { ok: false; error: ParsePostJfsEnvelopeError } {
  const trimmed = text.trim();

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(trimmed);
  } catch {
    jsonBody = undefined;
  }

  if (jsonBody !== undefined && isJfsEnvelopeJson(jsonBody)) {
    return { ok: true, envelope: jsonBody };
  }

  const compactEnvelope = tryUncompactJfsString(trimmed);
  if (compactEnvelope) {
    return { ok: true, envelope: compactEnvelope };
  }

  return {
    ok: false,
    error: {
      message:
        "POST body must be JSON with header, payload, and signature fields, or a JFS compact string (three dot-separated segments)",
    },
  };
}

async function hubVerifyDecodedPayload<TPayload>(
  decoded: DecodedJsonFarcasterSignature<TPayload>,
  options: { hubHttpBaseUrl?: string },
): Promise<
  | {
      valid: false;
      error: Error;
    }
  | {
      valid: true;
      signingUserFid: number;
      data: TPayload;
    }
> {
  const { header, payload } = decoded;

  const keys = await getActiveEd25519SignerKeysFromHubHttp(
    options.hubHttpBaseUrl ?? DEFAULT_SNAP_HUB_HTTP_BASE_URL,
    header.fid,
  );
  if (!keys.ok) {
    return {
      valid: false,
      error: new Error(keys.message),
    };
  }

  let headerKeyBytes: Uint8Array;
  try {
    headerKeyBytes = hexToBytes(header.key as Hex);
  } catch {
    return {
      valid: false,
      error: new Error("invalid JFS header key encoding"),
    };
  }

  if (headerKeyBytes.length !== 32) {
    return {
      valid: false,
      error: new Error("JFS app_key public key must be 32 bytes"),
    };
  }

  const matched = keys.signers.some((k) =>
    bytesEqual(k.publicKey, headerKeyBytes),
  );
  if (!matched) {
    return {
      valid: false,
      error: new Error(
        "active hub signer list does not include JFS header key",
      ),
    };
  }

  return {
    valid: true,
    data: payload,
    signingUserFid: header.fid,
  };
}

export async function verifyJFSRequestBody<TPayload>(
  requestBody: JsonFarcasterSignature,
  options: {
    hubHttpBaseUrl?: string;
  } = {},
): Promise<
  | {
      valid: false;
      error: Error;
    }
  | {
      valid: true;
      signingUserFid: number; // the FID of the user who signed the request
      data: TPayload;
    }
> {
  const decoded = tryDecodeJfs<TPayload>(requestBody);
  if (!decoded) {
    return {
      valid: false,
      error: new Error("invalid JFS envelope"),
    };
  }

  try {
    await verify({ data: requestBody, strict: true, keyTypes: ["app_key"] });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  return hubVerifyDecodedPayload(decoded, options);
}

export function decodePayload<TPayload>(payload: string): TPayload {
  return jfsDecodePayload<TPayload>(payload);
}

export function encodePayload<TPayload>(payload: TPayload): string {
  return jfsEncodePayload(payload);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
