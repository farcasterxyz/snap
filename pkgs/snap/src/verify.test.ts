import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyJFSRequestBody } from "./server/verify";

const validRequestBody = `{
  "header":"eyJmaWQiOjI2MTMxOSwidHlwZSI6ImFwcF9rZXkiLCJrZXkiOiIweGY0ZGQyNjczYTUzMjEwYzQ3ZGYzZjFmNTk0NjZlZTdhMTM3ZmQxOGQ5NTVjMmU2OGExMmQwOTE2MGE2NmMyMTUifQ",
  "payload":"eyJmaWQiOjI2MTMxOSwiaW5wdXRzIjp7ImRpc3BsYXkiOiJJU08gKFVUQykifSwiYnV0dG9uX2luZGV4IjowLCJ0aW1lc3RhbXAiOjE3NzQ2OTMyMTN9",
  "signature":"6eqXmzkoNDx8bSdEPdZ4NKKEyU9FfF3ENIpUnMGZ1XZwbbGtlGFB-I0e0IyuOzEmBDc04wPCuCCyxMg58pM3Cw"
}`;

/** Matches JFS header `key` (Ed25519 public key, 32 bytes hex without `0x` in hub JSON field). */
const HUB_SIGNER_KEY_HEX =
  "f4dd2673a53210c47df3f1f59466ee7a137fd18d955c2e68a12d09160a66c215";

describe("verifyJFSRequestBody", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const u = String(input);
        if (u.includes("/v1/onChainSignersByFid")) {
          return new Response(
            JSON.stringify({
              events: [
                {
                  type: "EVENT_TYPE_SIGNER",
                  chainId: 1,
                  blockNumber: 1,
                  blockHash: "0x" + "01".repeat(32),
                  blockTimestamp: 0,
                  transactionHash: "0x" + "02".repeat(32),
                  logIndex: 0,
                  fid: 261319,
                  signerEventBody: {
                    key: `0x${HUB_SIGNER_KEY_HEX}`,
                    keyType: 1,
                    eventType: "SIGNER_EVENT_TYPE_ADD",
                    metadata: "",
                    metadataType: 0,
                  },
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response("not found", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts JSON JFS body and verifies crypto + hub signer list", async () => {
    const result = await verifyJFSRequestBody(JSON.parse(validRequestBody));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({
        fid: 261319,
        inputs: { display: "ISO (UTC)" },
        button_index: 0,
        timestamp: 1774693213,
      });
    }
  });
});
