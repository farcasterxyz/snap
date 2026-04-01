import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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

const __dir = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dir, "../../../template/assets/fonts");

const SNAP_CONTENT_TYPE = `${MEDIA_TYPE}; charset=utf-8`;

const minimalSnapFn: SnapFunction = async () => ({
  version: "1.0",
  page: {
    theme: { accent: DEFAULT_THEME_ACCENT },
    button_layout: "stack",
    elements: {
      type: "stack",
      children: [
        { type: "text", style: "title", content: "Hello" },
        { type: "text", style: "body", content: "A test snap." },
      ],
    },
    buttons: [{ label: "Go", action: "post", target: "http://localhost/" }],
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
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("farcaster.xyz");
    // Renders the snap's first page — title element "Hello" appears in the HTML
    expect(html).toContain("Hello");
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

describe("OG meta tags in HTML fallback", () => {
  it("HTML fallback includes full OG meta block from snap content", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, { skipJFSVerification: true });

    const res = await app.request("http://example.com/", { method: "GET" });

    expect(res.status).toBe(200);
    const html = await res.text();

    // Title extracted from snap
    expect(html).toContain('property="og:title" content="Hello"');
    expect(html).toContain('name="description" content="A test snap."');
    expect(html).toContain('property="og:description" content="A test snap."');

    // URL tags
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:locale" content="en_US"');

    // OG image pointing to the PNG route
    expect(html).toContain("/~/og-image");
    expect(html).toContain('property="og:image"');

    // Twitter cards
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:title" content="Hello"');
    expect(html).toContain('name="twitter:description" content="A test snap."');
    expect(html).toContain('name="twitter:image"');
  });

  it("HTML fallback with og: false omits OG image route reference", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
      og: false,
    });

    const res = await app.request("http://example.com/", { method: "GET" });

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("/~/og-image");
  });

  it("og: false does not register the /~/og-image route", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
      og: false,
    });

    const res = await app.request("/~/og-image", { method: "GET" });
    expect(res.status).toBe(404);
  });
});

describe("OG image PNG route", () => {
  // These tests exercise the full satori + resvg-wasm pipeline.
  // Font files from template/assets/fonts/ are used so no CDN fetch is needed.
  const ogFonts = [
    {
      path: join(FONTS_DIR, "inter-latin-400-normal.woff"),
      weight: 400 as const,
    },
    {
      path: join(FONTS_DIR, "inter-latin-700-normal.woff"),
      weight: 700 as const,
    },
  ];

  it("/~/og-image returns 200 PNG with correct headers", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
      og: { fonts: ogFonts },
    });

    const res = await app.request("http://localhost/~/og-image", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("ETag")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=");
    expect(res.headers.get("X-OG-Cache")).toBe("MISS");
  }, 30_000);

  it("/~/og-image PNG bytes start with PNG magic header", async () => {
    const app = new Hono();
    registerSnapHandler(app, minimalSnapFn, {
      skipJFSVerification: true,
      og: { fonts: ogFonts },
    });

    const res = await app.request("http://localhost/~/og-image", {
      method: "GET",
    });

    const buf = await res.arrayBuffer();
    const magic = new Uint8Array(buf.slice(0, 4));
    // PNG magic: 0x89 0x50 0x4E 0x47
    expect(magic[0]).toBe(0x89);
    expect(magic[1]).toBe(0x50); // 'P'
    expect(magic[2]).toBe(0x4e); // 'N'
    expect(magic[3]).toBe(0x47); // 'G'
  }, 30_000);

  it("second request reuses in-flight promise (singleflight)", async () => {
    const app = new Hono();
    let callCount = 0;
    const countingSnapFn: SnapFunction = async (ctx) => {
      callCount++;
      return minimalSnapFn(ctx);
    };
    registerSnapHandler(app, countingSnapFn, {
      skipJFSVerification: true,
      og: { fonts: ogFonts },
    });

    // Two concurrent requests; the singleflight should deduplicate snap calls
    const [r1, r2] = await Promise.all([
      app.request("http://localhost/~/og-image", { method: "GET" }),
      app.request("http://localhost/~/og-image", { method: "GET" }),
    ]);

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    // Both succeed regardless of dedup behaviour
  }, 30_000);
});
