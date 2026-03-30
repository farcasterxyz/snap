import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { registerSnapHandler } from "../src/index";
import { encodePayload } from "@farcaster/jfs";
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
  });

  it("GET without snap Accept header returns HTML with Open Graph tags", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("http://localhost/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/html/);
    expect(res.headers.get("Vary")).toBe("Accept");
    const html = await res.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain("http://localhost/~/og-image");
  });

  it("GET without snap Accept and og: false returns plain text", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
      og: false,
    });

    const res = await app.request("/", { method: "GET" });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/^text\/plain/);
    expect(res.headers.get("Vary")).toBe("Accept");
  });

  it("GET /~/og-image returns PNG", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const res = await app.request("http://localhost/~/og-image", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("ETag")).toMatch(/^"[a-f0-9]+"$/);
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(100);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  it("GET /~/og-image returns 304 when If-None-Match matches ETag", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
    });

    const first = await app.request("http://localhost/~/og-image", {
      method: "GET",
    });
    const etag = first.headers.get("ETag");
    expect(etag).toBeTruthy();

    const second = await app.request("http://localhost/~/og-image", {
      method: "GET",
      headers: { "If-None-Match": etag! },
    });
    expect(second.status).toBe(304);
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
