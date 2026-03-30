import { encodeAbiParameters } from "viem";
import { describe, expect, it } from "vitest";
import { getActiveEd25519SignerKeysFromHubHttp } from "../src/server/hubs";

/** Ed25519 delegate key type in hub JSON (`SignerEventBody.keyType`). */
const ED25519_KEY_TYPE = 1;

function hubSignerEventJson(overrides: {
  blockNumber: number;
  logIndex: number;
  txIndex?: number;
  fid: number;
  keyHex: string;
  keyType: number;
  eventType: string;
  metadata?: string;
  metadataType?: number;
}) {
  return {
    type: "EVENT_TYPE_SIGNER",
    chainId: 1,
    blockNumber: overrides.blockNumber,
    blockHash: "0x" + "01".repeat(32),
    blockTimestamp: 0,
    transactionHash: "0x" + "02".repeat(32),
    logIndex: overrides.logIndex,
    txIndex: overrides.txIndex ?? 0,
    fid: overrides.fid,
    signerEventBody: {
      key: `0x${overrides.keyHex}`,
      keyType: overrides.keyType,
      eventType: overrides.eventType,
      metadata: overrides.metadata ?? "",
      metadataType: overrides.metadataType ?? 0,
    },
  };
}

describe("getActiveEd25519SignerKeysFromHubHttp", () => {
  it("parses events from JSON body", async () => {
    const keyHex = "33".repeat(32);
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.signers).toHaveLength(1);
      expect(Buffer.from(res.signers[0]!.publicKey).toString("hex")).toBe(
        keyHex,
      );
    }
  });

  it("keeps keys added and drops keys removed in chain order", async () => {
    const keyA = "0a" + "00".repeat(31);
    const keyB = "0b" + "00".repeat(31);
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex: keyA,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
            hubSignerEventJson({
              blockNumber: 2,
              logIndex: 0,
              fid: 5,
              keyHex: keyB,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
            hubSignerEventJson({
              blockNumber: 3,
              logIndex: 0,
              fid: 5,
              keyHex: keyA,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_REMOVE",
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.signers).toHaveLength(1);
      expect(Buffer.from(res.signers[0]!.publicKey).toString("hex")).toBe(keyB);
      expect(res.signers[0]!.signedKeyRequestMetadata).toBeNull();
    }
  });

  it("ignores non-Ed25519 key types", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex: "0a" + "00".repeat(31),
              keyType: 999,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.signers).toHaveLength(0);
  });

  it("attaches decoded metadata from ADD when metadata is valid ABI", async () => {
    const keyHex = "0a" + "00".repeat(31);
    const abiBytes = encodeAbiParameters(
      [
        {
          components: [
            { name: "requestFid", type: "uint256" },
            { name: "requestSigner", type: "address" },
            { name: "signature", type: "bytes" },
            { name: "deadline", type: "uint256" },
          ],
          type: "tuple",
        },
      ],
      [
        {
          requestFid: 777n,
          requestSigner: "0x00000000000000000000000000000000000000aa",
          signature: "0xbeef",
          deadline: 9_999_999_999n,
        },
      ],
    );
    const metadataB64 = Buffer.from(abiBytes.slice(2), "hex").toString(
      "base64",
    );
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
              metadata: metadataB64,
              metadataType: 1,
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.signers).toHaveLength(1);
      expect(res.signers[0]!.signedKeyRequestMetadata?.requestFid).toBe(777n);
    }
  });

  it("ignores signer rows with invalid key length", async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex: "aa".repeat(15),
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.signers).toHaveLength(0);
  });

  it("sorts events by blockNumber before replay (remove after add applies)", async () => {
    const keyHex = "0a" + "00".repeat(31);
    const fetchFn = async () =>
      new Response(
        JSON.stringify({
          events: [
            hubSignerEventJson({
              blockNumber: 2,
              logIndex: 0,
              fid: 5,
              keyHex,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_REMOVE",
            }),
            hubSignerEventJson({
              blockNumber: 1,
              logIndex: 0,
              fid: 5,
              keyHex,
              keyType: ED25519_KEY_TYPE,
              eventType: "SIGNER_EVENT_TYPE_ADD",
            }),
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    const res = await getActiveEd25519SignerKeysFromHubHttp(
      "https://hub.example:3381",
      5,
      { fetchFn },
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.signers).toHaveLength(0);
  });
});
