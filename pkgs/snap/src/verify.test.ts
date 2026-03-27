import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyJFSRequestBody } from "./verify";

const validRequestBody = `{
  "header": "eyJmaWQiOjIsInR5cGUiOiJhcHBfa2V5Iiwia2V5IjoiMHhiODVkZmMxMjg1ZGVlOTNiNDdhMTFhMzQ3NjczN2M1NmQxOGM2MTc1Y2U3MTA0MDhjNjNlOWNlNGYzNjNlMDhmIn0",
  "payload": "eyJhY3Rpb24iOiJtaW50IiwiY29udHJhY3RJZCI6IjB4YWJjIiwidGltZXN0YW1wIjoiMTc3NDU2ODc3NSJ9",
  "signature": "U3OILmid-c3S2tRARviHu67sbPGLSyGuMMvgCyXjuwa5LCKxxPLN6oaBCzKH-rJqGSShCS8NAXnBiNDikwvFBg"
}`;

/** Matches JFS header `key` (Ed25519 public key, 32 bytes hex without 0x in hub JSON field). */
const HUB_SIGNER_KEY_HEX =
  "b85dfc1285dee93b47a11a3476737c56d18c6175ce710408c63e9ce4f363e08f";

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
                  fid: 2,
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

  it("accepts JFS compact form and verifies JFS + hub signer list", async () => {
    const { header, payload, signature } = JSON.parse(validRequestBody) as {
      header: string;
      payload: string;
      signature: string;
    };
    const compact = `${header}.${payload}.${signature}`;
    const result = await verifyJFSRequestBody(compact);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({
        action: "mint",
        contractId: "0xabc",
        timestamp: "1774568775",
      });
    }
  });
});
