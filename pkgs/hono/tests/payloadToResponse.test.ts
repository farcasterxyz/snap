import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ACCENT, MEDIA_TYPE } from "@farcaster/snap";
import { payloadToResponse } from "../src/payloadToResponse";

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

  it("sets snap content type on success", () => {
    const r = payloadToResponse(minimalRoot);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe(`${MEDIA_TYPE}; charset=utf-8`);
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
