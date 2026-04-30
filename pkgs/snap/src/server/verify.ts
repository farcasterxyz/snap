import {
  decode,
  decodePayload as jfsDecodePayload,
  encodePayload as jfsEncodePayload,
  toJsonFarcasterSignature,
  verify,
  type JsonFarcasterSignature,
  type DecodedJsonFarcasterSignature,
} from "@farcaster/jfs";
import { hexToBytes, type Hex } from "viem";
import {
  DEFAULT_SNAP_HUB_HTTP_BASE_URL,
  getActiveEd25519SignerKeysFromHubHttp,
} from "./hubs";

/**
 * Parse a JFS object or string into normalized form (see {@link toJsonFarcasterSignature} / `uncompact`).
 */
export function parseJfs(
  text: string,
): { ok: true; jfs: JsonFarcasterSignature } | { ok: false; error: string } {
  const trimmed = text.trim();

  let jfsFromJson: unknown;
  try {
    jfsFromJson = JSON.parse(trimmed);
  } catch {
    jfsFromJson = undefined;
  }

  if (jfsFromJson !== undefined && isJfsObject(jfsFromJson)) {
    return { ok: true, jfs: jfsFromJson };
  }

  const jfsFromString = tryUncompactJfsString(trimmed);
  if (jfsFromString) {
    return { ok: true, jfs: jfsFromString };
  }

  return {
    ok: false,
    error:
      "invalid JFS envelope: must be JSON with header, payload, and signature fields, or a JFS compact string (three dot-separated segments)",
  };
}

export async function verifyJFS<TPayload>(
  jfs: JsonFarcasterSignature,
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
  const decoded = tryDecodeJfs<TPayload>(jfs);
  if (!decoded) {
    return {
      valid: false,
      error: new Error("invalid JFS envelope"),
    };
  }

  try {
    await verify({ data: jfs, strict: true, keyTypes: ["app_key"] });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  return hubVerifyDecodedPayload(decoded, options);
}

/**
 * Verify that the signing key for a JFS payload is an active signer for the FID.
 */
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

export function decodePayload<TPayload>(payload: string): TPayload {
  return jfsDecodePayload<TPayload>(payload);
}

export function encodePayload<TPayload>(payload: TPayload): string {
  return jfsEncodePayload(payload);
}

/**
 * Normalize a compact JFS string to `{ header, payload, signature }` using
 * `@farcaster/jfs` {@link toJsonFarcasterSignature} (which delegates to `uncompact` for strings).
 * Returns null if the string is malformed.
 */
function tryUncompactJfsString(value: string): JsonFarcasterSignature | null {
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
function tryDecodeJfs<TPayload>(
  input: JsonFarcasterSignature | string,
): DecodedJsonFarcasterSignature<TPayload> | null {
  try {
    return decode<TPayload>(input);
  } catch {
    return null;
  }
}

function isJfsObject(v: unknown): v is JsonFarcasterSignature {
  return (
    v !== null &&
    typeof v === "object" &&
    "header" in v &&
    typeof v.header === "string" &&
    "payload" in v &&
    typeof v.payload === "string" &&
    "signature" in v &&
    typeof v.signature === "string"
  );
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
