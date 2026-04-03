import { describe, expect, it } from "vitest";
import { MEDIA_TYPE } from "@farcaster/snap";
import {
  buildSnapAlternateLinkHeader,
  payloadToResponse,
} from "../src/payloadToResponse";

describe("payloadToResponse", () => {
  const minimalRoot = {
    version: "1.0" as const,
    ui: {
      root: "page",
      elements: {
        page: { type: "stack", props: {}, children: ["title"] },
        title: { type: "item", props: { title: "Hi" } },
      },
    },
  };

  it("sets snap content type and Link defaulting resource path to /", () => {
    const r = payloadToResponse(minimalRoot);
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toBe(`${MEDIA_TYPE}; charset=utf-8`);
    expect(r.headers.get("Vary")).toBe("Accept");
    expect(r.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/", [MEDIA_TYPE, "text/html"]),
    );
  });

  it("uses explicit resourcePath in Link when set", () => {
    const r = payloadToResponse(minimalRoot, { resourcePath: "/my-snap" });
    expect(r.headers.get("Link")).toBe(
      buildSnapAlternateLinkHeader("/my-snap", [MEDIA_TYPE, "text/html"]),
    );
  });

  it("returns 400 with issues on invalid payload", async () => {
    const r = payloadToResponse({
      version: "999" as "1.0",
      ui: {
        root: "",
        elements: {},
      },
    });
    expect(r.status).toBe(400);
    const json = (await r.json()) as { error: string; issues: unknown[] };
    expect(json.error).toBe("invalid snap page");
    expect(Array.isArray(json.issues)).toBe(true);
  });
});
