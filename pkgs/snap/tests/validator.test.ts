import { describe, it, expect } from "vitest";
import { DEFAULT_THEME_ACCENT } from "../src/colors";
import { snapResponseSchema } from "../src/schemas";
import { validateSnapResponse } from "../src/validator";

// ─── Helpers ────────────────────────────────────────────

function makeSpec(elements: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>, root = "page") {
  return { root, elements: { [root]: { type: "stack", children: Object.keys(elements) }, ...elements } };
}

function validMinimalSnap() {
  return {
    version: "1.0",
    ui: makeSpec({
      title: { type: "item", props: { title: "Hello" } },
    }),
  };
}

function expectValid(json: unknown) {
  const result = validateSnapResponse(json);
  expect(result.valid).toBe(true);
  expect(result.issues).toHaveLength(0);
}

function expectInvalid(json: unknown) {
  const result = validateSnapResponse(json);
  expect(result.valid).toBe(false);
  return result;
}

// ─── Schema basics ─────────────────────────────────────

describe("Schema basics", () => {
  it("accepts a valid minimal snap", () => {
    expectValid(validMinimalSnap());
  });

  it("applies defaults for theme when omitted", () => {
    const parsed = snapResponseSchema.parse(validMinimalSnap());
    expect(parsed.theme).toEqual({ accent: DEFAULT_THEME_ACCENT });
  });

  it("rejects non-object input", () => {
    expect(validateSnapResponse("nope").valid).toBe(false);
    expect(validateSnapResponse(null).valid).toBe(false);
  });

  it("requires version 1.0", () => {
    expectInvalid({ ui: makeSpec({ t: { type: "item", props: { title: "x" } } }) });
    expectInvalid({ version: "2.0", ui: makeSpec({ t: { type: "item", props: { title: "x" } } }) });
  });

  it("requires ui with root and elements", () => {
    expectInvalid({ version: "1.0" });
    expectInvalid({ version: "1.0", ui: {} });
    expectInvalid({ version: "1.0", ui: { root: "x" } });
  });

  it("accepts all element types in ui", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        a: { type: "item", props: { title: "Test" } },
        b: { type: "badge", props: { content: "New" } },
        c: { type: "image", props: { url: "https://example.com/img.jpg", aspect: "16:9" } },
        d: { type: "separator" },
        e: { type: "progress", props: { value: 50, max: 100 } },
      }),
    });
  });

  it("accepts interactive elements", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        a: { type: "input", props: { name: "text" } },
        b: { type: "slider", props: { name: "val", min: 0, max: 100 } },
        c: { type: "toggle_group", props: { name: "choice", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] } },
        d: { type: "switch", props: { name: "sw", label: "On" } },
        e: { type: "toggle_group", props: { name: "tg", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] } },
      }),
    });
  });

  it("accepts buttons with on.press actions", () => {
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["title", "submit"] },
          title: { type: "item", props: { title: "Hello" } },
          submit: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "submit", params: { target: "https://example.com/" } } },
          },
        },
      },
    });
  });

  it("accepts nested stacks with children", () => {
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["row"] },
          row: { type: "stack", props: { direction: "horizontal" }, children: ["a", "b"] },
          a: { type: "item", props: { title: "Left" } },
          b: { type: "item", props: { title: "Right" } },
        },
      },
    });
  });
});

// ─── Effects ───────────────────────────────────────────

describe("Effects", () => {
  it("accepts confetti effect", () => {
    expectValid({ ...validMinimalSnap(), effects: ["confetti"] });
  });

  it("rejects unknown effect", () => {
    expectInvalid({ ...validMinimalSnap(), effects: ["fireworks"] });
  });
});

// ─── Theme ─────────────────────────────────────────────

describe("Theme", () => {
  it("accepts valid accent color", () => {
    expectValid({ ...validMinimalSnap(), theme: { accent: "blue" } });
  });

  it("rejects invalid accent color", () => {
    expectInvalid({ ...validMinimalSnap(), theme: { accent: "neon" } });
  });
});
