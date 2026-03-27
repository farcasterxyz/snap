import { describe, expect, it } from "vitest";
import { parseRequest, sendResponse } from "@farcaster/snap";
import {
  DEFAULT_BUTTON_LAYOUT,
  DEFAULT_THEME_ACCENT,
  MEDIA_TYPE,
} from "../src/constants";

describe("parseRequest", () => {
  function postBody(overrides: Record<string, unknown> = {}) {
    return {
      fid: 42,
      inputs: { guess: "HELLO" },
      button_index: 0,
      timestamp: Math.floor(Date.now() / 1000),
      ...overrides,
    };
  }

  it("accepts GET as a first-page action", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", { method: "GET" }),
      { bypassSignatureVerification: true },
    );
    expect(res).toEqual({ ok: true, action: { type: "get" } });
  });

  it("accepts plain JSON POST when bypassSignatureVerification is true", async () => {
    const body = postBody();
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { bypassSignatureVerification: true },
    );
    expect(res).toEqual({
      ok: true,
      action: {
        type: "post",
        fid: 42,
        inputs: { guess: "HELLO" },
        buttonIndex: 0,
        timestamp: body.timestamp,
      },
    });
  });

  it("fails when bypass JSON is invalid", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: "not-json",
      }),
      { bypassSignatureVerification: true },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.type).toBe("invalid_json");
  });

  it("fails replay when timestamp is stale (bypass)", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify({
          ...postBody(),
          timestamp: Math.floor(Date.now() / 1000) - 400,
        }),
      }),
      { bypassSignatureVerification: true, maxSkewSeconds: 300 },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.type).toBe("replay");
  });

  it("fails JFS verification when body is not valid JFS (no bypass)", async () => {
    const res = await parseRequest(
      new Request("https://example.com/snap", {
        method: "POST",
        body: JSON.stringify(postBody()),
      }),
      { bypassSignatureVerification: false },
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.type).toBe("signature");
  });
});

describe("sendResponse", () => {
  const minimalRoot = {
    version: "1.0" as const,
    page: {
      theme: { accent: DEFAULT_THEME_ACCENT },
      button_layout: DEFAULT_BUTTON_LAYOUT,
      elements: {
        type: "stack" as const,
        children: [
          { type: "text" as const, style: "title" as const, content: "Hi" },
        ],
      },
    },
  };

  it("sets snap content type on success", () => {
    const r = sendResponse(minimalRoot);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe(`${MEDIA_TYPE}; charset=utf-8`);
  });

  it("accepts bare page and wraps version", async () => {
    const r = sendResponse(minimalRoot.page);
    expect(r.ok).toBe(true);
    const json = (await r.json()) as {
      version: string;
      page: typeof minimalRoot.page;
    };
    expect(json.version).toBe("1.0");
    expect(json.page.elements.children).toHaveLength(1);
  });

  it("returns 400 with issues on invalid payload", async () => {
    const r = sendResponse({
      version: "1.0" as const,
      page: {
        theme: { accent: DEFAULT_THEME_ACCENT },
        button_layout: DEFAULT_BUTTON_LAYOUT,
        elements: { type: "stack" as const, children: [] },
      },
    });
    expect(r.status).toBe(400);
    const json = (await r.json()) as { error: string; issues: unknown[] };
    expect(json.error).toBe("invalid snap page");
    expect(Array.isArray(json.issues)).toBe(true);
  });
});
