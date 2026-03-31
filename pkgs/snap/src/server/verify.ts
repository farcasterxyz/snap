import {
  compact,
  decode,
  decodePayload as jfsDecodePayload,
  encodePayload as jfsEncodePayload,
  verify,
} from "@farcaster/jfs";
import { hexToBytes, type Hex } from "viem";
import {
  DEFAULT_SNAP_HUB_HTTP_BASE_URL,
  getActiveEd25519SignerKeysFromHubHttp,
} from "./hubs";

export async function verifyJFSRequestBody<TPayload>(
  requestBody: {
    header: string;
    payload: string;
    signature: string;
  },
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
  let compactJfs: string;
  try {
    compactJfs = compact({
      header: requestBody.header,
      payload: requestBody.payload,
      signature: requestBody.signature,
    });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

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
    await verify({ data: compactJfs, strict: true, keyTypes: ["app_key"] });
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
