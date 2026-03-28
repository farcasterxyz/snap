import {
  compact,
  decode,
  verify as jfsVerify,
  type JsonFarcasterSignature,
} from "@farcaster/jfs";
import { hexToBytes, type Hex } from "viem";
import {
  DEFAULT_SNAP_HUB_HTTP_BASE_URL,
  getActiveEd25519SignerKeysFromHubHttp,
} from "./hubs";

export async function verifyJFSRequestBody<TPayload>(
  requestBody: string,
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
      data: TPayload;
    }
> {
  const normalized = jfsRequestBodyJsonToCompact(requestBody);
  if (!normalized.ok) {
    return { valid: false, error: normalized.error };
  }
  const compactJfs = normalized.compact;

  let decoded: ReturnType<typeof decode<TPayload>>;
  try {
    decoded = decode<TPayload>(compactJfs);
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  try {
    await jfsVerify({ data: compactJfs, strict: true, keyTypes: ["app_key"] });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

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
  };
}

/**
 * Snap POST bodies use JSON: `{ "header", "payload", "signature" }` (base64url segments).
 * This is turned into the JFS compact string (`header.payload.signature`) for crypto verification.
 */
function jfsRequestBodyJsonToCompact(
  raw: string,
): { ok: true; compact: string } | { ok: false; error: Error } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: new Error("request body is empty") };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: new Error("request body is not valid JSON"),
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error: new Error("request body must be a JSON object"),
    };
  }
  const o = parsed as Record<string, unknown>;
  const header = o.header;
  const payload = o.payload;
  const signature = o.signature;
  if (
    typeof header !== "string" ||
    typeof payload !== "string" ||
    typeof signature !== "string"
  ) {
    return {
      ok: false,
      error: new Error(
        "request body must include string header, payload, and signature",
      ),
    };
  }
  if (!header.trim() || !payload.trim() || !signature.trim()) {
    return {
      ok: false,
      error: new Error("header, payload, and signature must be non-empty"),
    };
  }
  const jfs: JsonFarcasterSignature = { header, payload, signature };
  return { ok: true, compact: compact(jfs) };
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
