import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { registerSnapHandler } from "../src/index";
import { buildSnapAlternateLinkHeader } from "../src/payloadToResponse";
import { encodePayload } from "@farcaster/snap/server";
import {
  MEDIA_TYPE,
  DEFAULT_THEME_ACCENT,
  type SnapFunction,
  type SnapPayload,
} from "@farcaster/snap";

const SNAP_CONTENT_TYPE = `${MEDIA_TYPE}; charset=utf-8`;

const minimalSnapFn: SnapFunction = async () => ({
  version: "1.0",
  page: {
    theme: { accent: DEFAULT_THEME_ACCENT },
    button_layout: "stack",
    elements: {
      type: "stack",
      children: [{ type: "text", style: "title", content: "Hello" }],
    },
  },
});

function jfsPostBody() {
  const payload: SnapPayload = {
    fid: 1,
    inputs: {},
    button_index: 0,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify({
    header: "dev",
    payload: encodePayload(payload),
    signature: "dev",
  });
}

describe("registerSnapHandler content type", () => {
  it("GET with snap Accept header returns snap content type", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", {
      method: "GET",
      headers: { Accept: MEDIA_TYPE },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(SNAP_CONTENT_TYPE);
    expect(res.headers.get("Vary")).toBe("Accept");
    expect(res.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/", [MEDIA_TYPE, "text/html"]),
    );
  });

  it("GET without snap Accept header returns HTML fallback", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/html/);
    expect(res.headers.get("Vary")).toBe("Accept");
    expect(res.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/", [MEDIA_TYPE, "text/html"]),
    );
    const html = await res.text();
    expect(html).toContain("Farcaster Snap server");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("POST success returns snap content type", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jfsPostBody(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(SNAP_CONTENT_TYPE);
    expect(res.headers.get("Vary")).toBe("Accept");
    expect(res.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/", [MEDIA_TYPE, "text/html"]),
    );
  });

  it("POST with bare JSON body returns 400 when skipping JFS verification", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fid: 1,
        inputs: {},
        button_index: 0,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    });

    expect(res.status).toBe(400);
    expect(res.headers.get("Content-Type")).toMatch(/^application\/json/);
  });

  it("POST with invalid body returns application/json (not snap type)", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", {
      method: "POST",
      body: "not json",
    });

    expect(res.status).toBe(400);
    expect(res.headers.get("Content-Type")).toMatch(/^application\/json/);
  });

  it("response body contains correct version and page", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("/", {
      method: "GET",
      headers: { Accept: MEDIA_TYPE },
    });

    const json = (await res.json()) as { version: string; page: unknown };
    expect(json.version).toBe("1.0");
    expect(json.page).toBeDefined();
  });
});
