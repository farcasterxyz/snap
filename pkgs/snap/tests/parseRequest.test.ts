import { describe, expect, it } from "vitest";
import { parseRequest, encodePayload, decodePayload } from "../src/server";
import { type SnapPayload } from "../src/schemas";

describe("parseRequest", () => {
  function postBody(overrides: Record<string, unknown> = {}) {
    const payload: SnapPayload = {
      fid: 42,
      inputs: { guess: "HELLO" },
      timestamp: Math.floor(Date.now() / 1000),
      nonce: "test-nonce-abc",
      audience: "https://example.com",
      ...overrides,
    };
    return {
      header: "dev",
      payload: encodePayload(payload),
      signature: "dev",
    };
  }

  it("accepts GET as a first-page action", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", { method: "GET" }),
      { skipJFSVerification: true },
    );
    expect(res).toEqual({ success: true, action: { type: "get" } });
  });

  it("accepts JFS-shaped POST even when skipJFSVerification is true", async () => {
    const body = postBody();
    const payload = decodePayload<SnapPayload>(body.payload);
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { skipJFSVerification: true },
    );
    expect(res).toEqual({
      success: true,
      action: {
        type: "post",
        fid: 42,
        inputs: { guess: "HELLO" },
        timestamp: payload.timestamp,
        nonce: "test-nonce-abc",
        audience: "https://example.com",
      },
    });
  });

  it("does not accept bare JSON POST payload even when skipJFSVerification is true", async () => {
    const payload: SnapPayload = {
      fid: 42,
      inputs: { guess: "HELLO" },
      timestamp: Math.floor(Date.now() / 1000),
      nonce: "n",
      audience: "https://example.com",
    };
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.type).toBe("invalid_json");
  });

  it("fails when bypass JSON is invalid", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: "not-json",
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.type).toBe("invalid_json");
  });

  it("fails replay when timestamp is stale (bypass)", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(
          postBody({
            timestamp: Math.floor(Date.now() / 1000) - 400,
          }),
        ),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.type).toBe("replay");
  });

  it("fails JFS verification when body is not valid JFS (no bypass)", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(postBody()),
      }),
      { skipJFSVerification: false },
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.type).toBe("signature");
  });

  it("fails when payload audience does not match request origin", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(postBody({ audience: "https://evil.com" })),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.type).toBe("origin_mismatch");
      if (res.error.type === "origin_mismatch") {
        expect(res.error.message).toContain("https://evil.com");
        expect(res.error.message).toContain("https://example.com");
      }
    }
  });

  it("accepts POST when payload audience matches request origin", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(postBody({ audience: "https://example.com" })),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(true);
  });
});
