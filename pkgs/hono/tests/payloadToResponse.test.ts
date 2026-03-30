import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ACCENT, MEDIA_TYPE } from "@farcaster/snap";
import {
  buildSnapAlternateLinkHeader,
  payloadToResponse,
} from "../src/payloadToResponse";

describe("payloadToResponse", () => {
  const minimalRoot = {
    version: "1.0" as const,
    page: {
      theme: { accent: DEFAULT_THEME_ACCENT },
      button_layout: "stack" as const,
      elements: {
        type: "stack" as const,
        children: [
          { type: "text" as const, style: "title" as const, content: "Hi" },
        ],
      },
    },
  };

  it("sets snap content type and Link defaulting resource path to /", () => {
    const r = payloadToResponse(minimalRoot);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe(`${MEDIA_TYPE}; charset=utf-8`);
    expect(r.headers.get("Vary")).toBe("Accept");
    expect(r.headers.get("Link")).toBe(buildSnapAlternateLinkHeader("/"));
  });

  it("uses explicit resourcePath in Link when set", () => {
    const r = payloadToResponse(minimalRoot, { resourcePath: "/my-snap" });
    expect(r.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/my-snap"),
    );
  });

  it("returns 400 with issues on invalid payload", async () => {
    const r = payloadToResponse({
      version: "1.0" as const,
      page: {
        theme: { accent: DEFAULT_THEME_ACCENT },
        button_layout: "stack" as const,
        elements: { type: "stack" as const, children: [] },
      },
    });
    expect(r.status).toBe(400);
    const json = (await r.json()) as { error: string; issues: unknown[] };
    expect(json.error).toBe("invalid snap page");
    expect(Array.isArray(json.issues)).toBe(true);
  });
});
