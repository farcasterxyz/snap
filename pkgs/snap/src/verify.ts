import { decode, verify as jfsVerify } from "@farcaster/jfs";
import { hexToBytes, type Hex } from "viem";
import {
  DEFAULT_SNAP_HUB_HTTP_BASE_URL,
  getActiveEd25519SignerKeysFromHubHttp,
} from "./hubs";

export async function verifyJFSRequestBody<TPayload>(
  requestBody: string,
  options: {
    debug?: boolean;
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
  const log = (...args: unknown[]) => {
    if (options.debug) {
      // eslint-disable-next-line no-console -- opt-in via options.debug
      console.log("[verifyJFS]", "verifyJFSRequestBody:", ...args);
    }
  };

  try {
    log("step: verifying JFS request body");
    await jfsVerify({ data: requestBody, strict: true, keyTypes: ["app_key"] });
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  log("step: decoding JFS request body");
  const { header, payload } = decode<TPayload>(requestBody);

  log("step: getting active Ed25519 signer keys from hub");
  const keys = await getActiveEd25519SignerKeysFromHubHttp(
    DEFAULT_SNAP_HUB_HTTP_BASE_URL,
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
    log("step: converting JFS header key to bytes");
    headerKeyBytes = hexToBytes(header.key as Hex);
  } catch {
    return {
      valid: false,
      error: new Error("invalid JFS header key encoding"),
    };
  }

  if (headerKeyBytes.length !== 32) {
    log("step: JFS header key must be 32 bytes");
    return {
      valid: false,
      error: new Error("JFS app_key public key must be 32 bytes"),
    };
  }

  log("step: checking if JFS header key is in the active hub signer list");
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

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
