import { describe, expect, it } from "vitest";
import { parseRequest, sendResponse, type SnapPayload } from "../src/index";
import {
  DEFAULT_BUTTON_LAYOUT,
  DEFAULT_THEME_ACCENT,
  MEDIA_TYPE,
} from "../src/constants";
import { decodePayload, encodePayload } from "@farcaster/jfs";

describe("parseRequest", () => {
  function postBody(overrides: Record<string, unknown> = {}) {
    const payload: SnapPayload = {
      fid: 42,
      inputs: { guess: "HELLO" },
      button_index: 0,
      timestamp: Math.floor(Date.now() / 1000),
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

  it("accepts plain JSON POST when skipJFSVerification is true", async () => {
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
        buttonIndex: 0,
        timestamp: payload.timestamp,
      },
    });
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
