import { decodeAbiParameters, type Hex } from "viem";

// Protobuf enum values from @farcaster/hub-nodejs, inlined to avoid pulling
// in the full gRPC stack (which is incompatible with Edge runtimes).
const OnChainEventType = {
  EVENT_TYPE_NONE: 0,
  EVENT_TYPE_SIGNER: 1,
  EVENT_TYPE_SIGNER_MIGRATED: 2,
  EVENT_TYPE_ID_REGISTER: 3,
  EVENT_TYPE_STORAGE_RENT: 4,
  EVENT_TYPE_TIER_PURCHASE: 5,
} as const;
type OnChainEventType =
  (typeof OnChainEventType)[keyof typeof OnChainEventType];

const SignerEventType = {
  NONE: 0,
  ADD: 1,
  REMOVE: 2,
  ADMIN_RESET: 3,
} as const;
type SignerEventType = (typeof SignerEventType)[keyof typeof SignerEventType];

type OnChainEvent = {
  type: OnChainEventType;
  chainId: number;
  blockNumber: number;
  blockHash: Uint8Array;
  blockTimestamp: number;
  transactionHash: Uint8Array;
  logIndex: number;
  fid: number;
  txIndex?: number;
  version?: number;
  signerEventBody?: {
    key: Uint8Array;
    keyType: number;
    eventType: SignerEventType;
    metadata: Uint8Array;
    metadataType?: number;
  };
};

// ---------------------------------------------------------------------------
// Hex (hub HTTP JSON decoders)
// ---------------------------------------------------------------------------

/**
 * Parse contiguous hex (no `0x`) into bytes. Used by hub HTTP JSON decoders only.
 */
function parseHexToBytes(hex: string): Uint8Array | undefined {
  if (hex.length % 2 !== 0) return undefined;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return undefined;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hub base URL
// ---------------------------------------------------------------------------

/**
 * Default hub HTTP base URL (Hubble HTTP API on the public hub TLS port).
 */
export const DEFAULT_SNAP_HUB_HTTP_BASE_URL = "https://rho.farcaster.xyz:3381";

function stripTrailingSlashFromUrl(base: string): string {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function stripHubHttpBaseUrlTrailingSlash(base: string): string {
  return stripTrailingSlashFromUrl(base.trim());
}

// ---------------------------------------------------------------------------
// On-chain signer events → active Ed25519 keys
// ---------------------------------------------------------------------------

/** Farcaster `SignerEventBody.keyType` for Ed25519 delegate signers. */
const FARCASTER_SIGNER_KEY_TYPE_ED25519 = 1;

const SIGNED_KEY_REQUEST_METADATA_ABI = [
  {
    components: [
      { name: "requestFid", type: "uint256" },
      { name: "requestSigner", type: "address" },
      { name: "signature", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
    type: "tuple",
  },
] as const;

function onChainEventSortKey(ev: OnChainEvent): [number, number, number] {
  return [ev.blockNumber, ev.txIndex ?? 0, ev.logIndex];
}

type DecodedSignedKeyRequestMetadata = {
  requestFid: bigint;
  requestSigner: Hex;
  signature: Uint8Array;
  deadline: bigint;
};

/**
 * Decodes `SignerEventBody.metadata` as ABI-encoded `SignedKeyRequestMetadata`.
 * Returns `null` when empty or not valid ABI for that struct.
 */
function decodeSignedKeyRequestMetadata(
  metadata: Uint8Array,
): DecodedSignedKeyRequestMetadata | null {
  if (!metadata.length) return null;
  try {
    const hex = `0x${Buffer.from(metadata).toString("hex")}` as Hex;
    const decoded = decodeAbiParameters(SIGNED_KEY_REQUEST_METADATA_ABI, hex);
    const row = decoded[0] as {
      requestFid: bigint;
      requestSigner: Hex;
      signature: Hex;
      deadline: bigint;
    };
    const sigHex = row.signature.startsWith("0x")
      ? row.signature.slice(2)
      : row.signature;
    const sigBytes = parseHexToBytes(sigHex);
    if (!sigBytes) return null;
    return {
      requestFid: row.requestFid,
      requestSigner: row.requestSigner,
      signature: sigBytes,
      deadline: row.deadline,
    };
  } catch {
    return null;
  }
}

type ActiveEd25519Signer = {
  publicKey: Uint8Array;
  /**
   * From the latest ADD event for this key. `null` when metadata is empty or not decodable
   * as `SignedKeyRequestMetadata`.
   */
  signedKeyRequestMetadata: DecodedSignedKeyRequestMetadata | null;
};

/**
 * Replays signer on-chain events into the set of currently active Ed25519 delegate keys
 * (with decoded key-request metadata from each key's latest ADD).
 */
function activeEd25519SignerKeysFromEvents(
  events: OnChainEvent[],
): ActiveEd25519Signer[] {
  const sorted = [...events].sort((a, b) => {
    const ka = onChainEventSortKey(a);
    const kb = onChainEventSortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i]) return ka[i] - kb[i];
    }
    return 0;
  });

  const active = new Map<string, ActiveEd25519Signer>();

  for (const ev of sorted) {
    if (ev.type !== OnChainEventType.EVENT_TYPE_SIGNER) continue;
    const body = ev.signerEventBody;
    if (!body?.key || body.keyType !== FARCASTER_SIGNER_KEY_TYPE_ED25519)
      continue;
    if (body.key.length !== 32) continue;

    const hexKey = Buffer.from(body.key).toString("hex");
    const metaBytes = body.metadata ?? new Uint8Array();

    switch (body.eventType) {
      case SignerEventType.ADD:
        active.set(hexKey, {
          publicKey: body.key,
          signedKeyRequestMetadata: decodeSignedKeyRequestMetadata(metaBytes),
        });
        break;
      case SignerEventType.REMOVE:
        active.delete(hexKey);
        break;
      default:
        break;
    }
  }

  return [...active.values()];
}

type FetchSignerKeysResult =
  | { ok: true; signers: ActiveEd25519Signer[] }
  | { ok: false; message: string };

// ---------------------------------------------------------------------------
// Hubble HTTP API (`/v1/onChainSignersByFid`)
// ---------------------------------------------------------------------------

/** 32-byte hashes in hub HTTP JSON are `0x` + hex (64 chars). */
function decodeHubHttp0xHex(value: unknown): Uint8Array | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!/^0x[0-9a-fA-F]+$/.test(t)) return undefined;
  const bytes = parseHexToBytes(t.slice(2));
  return bytes ? Uint8Array.from(bytes) : undefined;
}

/** Signer key: `0x` + 64 hex chars, or 64 hex chars without prefix. */
function decodeHubHttpSignerKeyField(value: unknown): Uint8Array | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (/^0x[0-9a-fA-F]+$/.test(t)) {
    const bytes = parseHexToBytes(t.slice(2));
    return bytes ? Uint8Array.from(bytes) : undefined;
  }
  if (/^[0-9a-fA-F]{64}$/.test(t)) {
    const bytes = parseHexToBytes(t);
    return bytes ? Uint8Array.from(bytes) : undefined;
  }
  return undefined;
}

/** `metadata` in hub HTTP JSON is standard base64 (not hex; may look hex-like). */
function decodeHubHttpMetadataBase64(value: unknown): Uint8Array {
  if (value === null || value === undefined) return new Uint8Array();
  if (typeof value !== "string") return new Uint8Array();
  const t = value.trim();
  if (!t) return new Uint8Array();
  try {
    return new Uint8Array(Buffer.from(t, "base64"));
  } catch {
    return new Uint8Array();
  }
}

const HTTP_ON_CHAIN_TYPE: Partial<Record<string, OnChainEventType>> = {
  EVENT_TYPE_NONE: OnChainEventType.EVENT_TYPE_NONE,
  EVENT_TYPE_SIGNER: OnChainEventType.EVENT_TYPE_SIGNER,
  EVENT_TYPE_SIGNER_MIGRATED: OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
  EVENT_TYPE_ID_REGISTER: OnChainEventType.EVENT_TYPE_ID_REGISTER,
  EVENT_TYPE_STORAGE_RENT: OnChainEventType.EVENT_TYPE_STORAGE_RENT,
  EVENT_TYPE_TIER_PURCHASE: OnChainEventType.EVENT_TYPE_TIER_PURCHASE,
};

const HTTP_SIGNER_EVENT_TYPE: Partial<Record<string, SignerEventType>> = {
  SIGNER_EVENT_TYPE_NONE: SignerEventType.NONE,
  SIGNER_EVENT_TYPE_ADD: SignerEventType.ADD,
  SIGNER_EVENT_TYPE_REMOVE: SignerEventType.REMOVE,
  SIGNER_EVENT_TYPE_ADMIN_RESET: SignerEventType.ADMIN_RESET,
};

/**
 * Maps one hub HTTP `OnChainEventSigner` JSON object to {@link OnChainEvent}.
 * Returns `null` when required fields are missing or invalid.
 */
function onChainEventFromHubHttpJson(row: unknown): OnChainEvent | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const typeStr = o.type;
  if (typeof typeStr !== "string") return null;
  const type = HTTP_ON_CHAIN_TYPE[typeStr];
  if (type === undefined) return null;

  const chainId = o.chainId;
  const blockNumber = o.blockNumber;
  const blockTimestamp = o.blockTimestamp;
  const logIndex = o.logIndex;
  const fid = o.fid;
  if (
    typeof chainId !== "number" ||
    typeof blockNumber !== "number" ||
    typeof blockTimestamp !== "number" ||
    typeof logIndex !== "number" ||
    typeof fid !== "number"
  ) {
    return null;
  }

  const blockHash = decodeHubHttp0xHex(o.blockHash);
  const transactionHash = decodeHubHttp0xHex(o.transactionHash);
  if (!blockHash || !transactionHash) return null;

  const txIndex = typeof o.txIndex === "number" ? o.txIndex : 0;
  const version = typeof o.version === "number" ? o.version : 0;

  const bodyRaw = o.signerEventBody;
  if (!bodyRaw || typeof bodyRaw !== "object") return null;
  const b = bodyRaw as Record<string, unknown>;
  const key = decodeHubHttpSignerKeyField(b.key);
  const keyType = b.keyType;
  const eventTypeStr = b.eventType;
  if (!key || typeof keyType !== "number" || typeof eventTypeStr !== "string") {
    return null;
  }
  const eventType = HTTP_SIGNER_EVENT_TYPE[eventTypeStr];
  if (eventType === undefined) return null;

  const metadata = decodeHubHttpMetadataBase64(b.metadata);
  const metadataType = typeof b.metadataType === "number" ? b.metadataType : 0;

  return {
    type,
    chainId,
    blockNumber,
    blockHash,
    blockTimestamp,
    transactionHash,
    logIndex,
    fid,
    txIndex,
    version,
    signerEventBody: {
      key,
      keyType,
      eventType,
      metadata,
      metadataType,
    },
  };
}

type FetchSignerKeysFromHubHttpOptions = {
  /** Override global `fetch` (tests or non-Request environments). */
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

/**
 * Loads on-chain signer events via Hubble HTTP API (`GET /v1/onChainSignersByFid`)
 * and returns active Ed25519 delegate keys from signer events.
 */
export async function getActiveEd25519SignerKeysFromHubHttp(
  httpBaseUrl: string,
  fid: number,
  options?: FetchSignerKeysFromHubHttpOptions,
): Promise<FetchSignerKeysResult> {
  const base = stripHubHttpBaseUrlTrailingSlash(httpBaseUrl);
  const url = `${base}/v1/onChainSignersByFid?fid=${encodeURIComponent(
    String(fid),
  )}`;
  const fetchImpl = options?.fetchFn ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return {
      ok: false,
      message:
        "fetch is not available; pass fetchFn in options or use Node.js 18+",
    };
  }

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options?.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }

  if (!res.ok) {
    let detail = "";
    try {
      const t = await res.text();
      if (t) detail = t.length > 240 ? `${t.slice(0, 240)}…` : t;
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      message: `HTTP ${res.status}${detail ? `: ${detail}` : ""}`,
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `invalid JSON: ${msg}` };
  }

  if (!json || typeof json !== "object") {
    return { ok: false, message: "hub response: expected JSON object" };
  }
  const eventsRaw = (json as Record<string, unknown>).events;
  if (!Array.isArray(eventsRaw)) {
    return { ok: false, message: "hub response: missing events array" };
  }

  const events: OnChainEvent[] = [];
  for (const item of eventsRaw) {
    const ev = onChainEventFromHubHttpJson(item);
    if (ev) events.push(ev);
  }

  return { ok: true, signers: activeEd25519SignerKeysFromEvents(events) };
}
