import { describe, expect, it } from "vitest";
import { parseRequest, encodePayload, decodePayload } from "../src/server";
import { type SnapPayload } from "../src/schemas";

describe("parseRequest", () => {
  const surfaceStandalone = { type: "standalone" as const };

  function postBody(overrides: Record<string, unknown> = {}) {
    const payload: SnapPayload = {
      fid: 42,
      inputs: { guess: "HELLO" },
      timestamp: Math.floor(Date.now() / 1000),
      audience: "https://example.com",
      user: { fid: 42 },
      surface: surfaceStandalone,
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
        audience: "https://example.com",
        user: { fid: 42 },
        surface: surfaceStandalone,
      },
    });
  });

  it("accepts JFS compact string POST body when skipJFSVerification is true", async () => {
    const body = postBody();
    const compact = `${body.header}.${body.payload}.${body.signature}`;
    const payload = decodePayload<SnapPayload>(body.payload);
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: compact,
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
        audience: "https://example.com",
        user: { fid: 42 },
        surface: surfaceStandalone,
      },
    });
  });

  it("does not accept bare JSON POST payload even when skipJFSVerification is true", async () => {
    const payload: SnapPayload = {
      fid: 42,
      inputs: { guess: "HELLO" },
      timestamp: Math.floor(Date.now() / 1000),
      audience: "https://example.com",
      user: { fid: 42 },
      surface: surfaceStandalone,
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

  it("strips legacy button_index from payload (backward compat)", async () => {
    const body = postBody({ button_index: 0 });
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(body),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.action.type).toBe("post");
      expect("button_index" in res.action).toBe(false);
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

  it("accepts cast surface on POST payload", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(
          postBody({
            surface: {
              type: "cast",
              cast: {
                hash: "0xabc",
                author: { fid: 99 },
              },
            },
          }),
        ),
      }),
      { skipJFSVerification: true },
    );
    expect(res.success).toBe(true);
    if (res.success && res.action.type === "post") {
      expect(res.action.surface).toEqual({
        type: "cast",
        cast: {
          hash: "0xabc",
          author: { fid: 99 },
        },
      });
    }
  });
});
