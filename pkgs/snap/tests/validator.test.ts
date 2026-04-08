import { describe, it, expect } from "vitest";
import { DEFAULT_THEME_ACCENT } from "../src/colors";
import { MAX_CHILDREN, MAX_DEPTH, MAX_ELEMENTS, MAX_ROOT_CHILDREN } from "../src/constants";
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

// ─── Root validation ──────────────────────────────────

describe("Root validation", () => {
  it("rejects root that does not exist in elements", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "missing",
        elements: {
          page: { type: "stack", children: ["title"] },
          title: { type: "item", props: { title: "Hello" } },
        },
      },
    });
    expect(result.issues[0].message).toContain("missing");
    expect(result.issues[0].message).toContain("does not exist");
  });

  it("accepts root that exists in elements", () => {
    expectValid(validMinimalSnap());
  });
});

// ─── URL validation ───────────────────────────────────

describe("URL validation", () => {
  it("accepts HTTPS image URL with valid extension", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/photo.jpg", aspect: "16:9" } },
      }),
    });
  });

  it("accepts HTTPS image URL with png extension", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/photo.png", aspect: "1:1" } },
      }),
    });
  });

  it("accepts HTTPS image URL with gif extension", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/anim.gif", aspect: "4:3" } },
      }),
    });
  });

  it("accepts HTTPS image URL with webp extension", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/img.webp", aspect: "16:9" } },
      }),
    });
  });

  it("accepts localhost HTTP image URL for dev", () => {
    expectValid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "http://localhost:3000/photo.jpg", aspect: "16:9" } },
      }),
    });
  });

  it("rejects HTTP image URL on non-loopback host", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "http://evil.com/photo.jpg", aspect: "16:9" } },
      }),
    });
    expect(result.issues[0].message).toContain("HTTPS");
  });

  it("rejects image URL with unsupported extension", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/file.svg", aspect: "16:9" } },
      }),
    });
    expect(result.issues[0].message).toContain("unsupported extension");
  });

  it("rejects image URL without extension", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "https://example.com/photo", aspect: "16:9" } },
      }),
    });
    expect(result.issues[0].message).toContain("supported extension");
  });

  it("rejects javascript: URI in image", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: makeSpec({
        img: { type: "image", props: { url: "javascript:alert(1)", aspect: "16:9" } },
      }),
    });
    expect(result.issues[0].message).toContain("javascript");
  });

  it("accepts HTTPS action target URL", () => {
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "submit", params: { target: "https://example.com/api" } } },
          },
        },
      },
    });
  });

  it("accepts localhost HTTP action target for dev", () => {
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "submit", params: { target: "http://localhost:3000/api" } } },
          },
        },
      },
    });
  });

  it("rejects HTTP action target on non-loopback host", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "submit", params: { target: "http://evil.com/api" } } },
          },
        },
      },
    });
    expect(result.issues[0].message).toContain("HTTPS");
  });

  it("rejects javascript: URI in action target", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "open_url", params: { target: "javascript:alert(1)" } } },
          },
        },
      },
    });
    expect(result.issues[0].message).toContain("javascript");
  });

  it("validates open_url action targets", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "open_url", params: { target: "http://evil.com" } } },
          },
        },
      },
    });
    expect(result.issues[0].message).toContain("HTTPS");
  });

  it("validates open_mini_app action targets", () => {
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "Go" },
            on: { press: { action: "open_mini_app", params: { target: "http://evil.com" } } },
          },
        },
      },
    });
    expect(result.issues[0].message).toContain("HTTPS");
  });

  it("does not validate URLs for non-URL actions", () => {
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["btn"] },
          btn: {
            type: "button",
            props: { label: "View" },
            on: { press: { action: "view_cast", params: { hash: "0xabc123" } } },
          },
        },
      },
    });
  });
});

// ─── Structural constraints ───────────────────────────

describe("Structural constraints", () => {
  it("rejects a snap with too many elements", () => {
    const elements: Record<string, { type: string; props?: Record<string, unknown> }> = {};
    const childIds: string[] = [];
    for (let i = 0; i < MAX_ELEMENTS + 1; i++) {
      const id = `el_${i}`;
      elements[id] = { type: "text", props: { content: `text ${i}` } };
      childIds.push(id);
    }
    // root + all the generated elements exceeds MAX_ELEMENTS
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: childIds },
          ...elements,
        },
      },
    });
    expect(result.issues[0].message).toContain("maximum");
    expect(result.issues[0].message).toContain("elements");
  });

  it("accepts a snap at the element limit", () => {
    // Build a tree with exactly MAX_ELEMENTS elements.
    // Root gets MAX_ROOT_CHILDREN groups, each group gets up to MAX_CHILDREN leaves.
    // Some groups use a nested subgroup to consume remaining elements.
    const elements: Record<string, { type: string; children?: string[]; props?: Record<string, unknown> }> = {};
    let remaining = MAX_ELEMENTS - 1; // minus root
    const topChildren: string[] = [];
    let uid = 0;

    for (let g = 0; g < MAX_ROOT_CHILDREN && remaining > 0; g++) {
      const groupId = `g${g}`;
      topChildren.push(groupId);
      remaining--; // count the group itself

      const leafIds: string[] = [];
      const maxLeaves = Math.min(remaining, MAX_CHILDREN);
      for (let i = 0; i < maxLeaves; i++) {
        // If this is the last slot and we still have remaining, make it a subgroup
        if (i === maxLeaves - 1 && remaining - 1 > maxLeaves - i) {
          const subId = `s${uid++}`;
          leafIds.push(subId);
          remaining--;
          const subLeafIds: string[] = [];
          const subCount = Math.min(remaining, MAX_CHILDREN);
          for (let j = 0; j < subCount; j++) {
            const leafId = `l${uid++}`;
            elements[leafId] = { type: "text", props: { content: "t" } };
            subLeafIds.push(leafId);
            remaining--;
          }
          elements[subId] = { type: "stack", children: subLeafIds };
        } else {
          const leafId = `l${uid++}`;
          elements[leafId] = { type: "text", props: { content: "t" } };
          leafIds.push(leafId);
          remaining--;
        }
      }
      elements[groupId] = { type: "stack", children: leafIds };
    }
    elements["page"] = { type: "stack", children: topChildren };

    expect(Object.keys(elements).length).toBe(MAX_ELEMENTS);

    expectValid({
      version: "1.0",
      ui: { root: "page", elements },
    });
  });

  it("rejects root with too many children", () => {
    const elements: Record<string, { type: string; props?: Record<string, unknown> }> = {};
    const childIds: string[] = [];
    for (let i = 0; i < MAX_ROOT_CHILDREN + 1; i++) {
      const id = `child_${i}`;
      elements[id] = { type: "text", props: { content: `text ${i}` } };
      childIds.push(id);
    }
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: childIds },
          ...elements,
        },
      },
    });
    expect(result.issues[0].message).toContain("children");
    expect(result.issues[0].message).toContain("page");
  });

  it("accepts root at the root children limit", () => {
    const elements: Record<string, { type: string; props?: Record<string, unknown> }> = {};
    const childIds: string[] = [];
    for (let i = 0; i < MAX_ROOT_CHILDREN; i++) {
      const id = `child_${i}`;
      elements[id] = { type: "text", props: { content: `text ${i}` } };
      childIds.push(id);
    }
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: childIds },
          ...elements,
        },
      },
    });
  });

  it("rejects a non-root element with too many children", () => {
    const elements: Record<string, { type: string; props?: Record<string, unknown> }> = {};
    const childIds: string[] = [];
    for (let i = 0; i < MAX_CHILDREN + 1; i++) {
      const id = `child_${i}`;
      elements[id] = { type: "text", props: { content: `text ${i}` } };
      childIds.push(id);
    }
    const result = expectInvalid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["group"] },
          group: { type: "stack", children: childIds },
          ...elements,
        },
      },
    });
    expect(result.issues[0].message).toContain("children");
    expect(result.issues[0].message).toContain("group");
  });

  it("accepts a non-root element at the children limit", () => {
    const elements: Record<string, { type: string; props?: Record<string, unknown> }> = {};
    const childIds: string[] = [];
    for (let i = 0; i < MAX_CHILDREN; i++) {
      const id = `child_${i}`;
      elements[id] = { type: "text", props: { content: `text ${i}` } };
      childIds.push(id);
    }
    expectValid({
      version: "1.0",
      ui: {
        root: "page",
        elements: {
          page: { type: "stack", children: ["group"] },
          group: { type: "stack", children: childIds },
          ...elements,
        },
      },
    });
  });

  it("rejects a snap that exceeds max nesting depth", () => {
    // Build a chain deeper than MAX_DEPTH
    const elements: Record<string, { type: string; children?: string[]; props?: Record<string, unknown> }> = {};
    let prevId = "";
    for (let i = MAX_DEPTH; i >= 0; i--) {
      const id = `level_${i}`;
      if (prevId) {
        elements[id] = { type: "stack", children: [prevId] };
      } else {
        elements[id] = { type: "text", props: { content: "leaf" } };
      }
      prevId = id;
    }
    const result = expectInvalid({
      version: "1.0",
      ui: { root: prevId, elements },
    });
    expect(result.issues[0].message).toContain("depth");
  });

  it("accepts a snap at the max nesting depth", () => {
    // Build a chain exactly at MAX_DEPTH
    const elements: Record<string, { type: string; children?: string[]; props?: Record<string, unknown> }> = {};
    let prevId = "";
    for (let i = MAX_DEPTH - 1; i >= 0; i--) {
      const id = `level_${i}`;
      if (prevId) {
        elements[id] = { type: "stack", children: [prevId] };
      } else {
        elements[id] = { type: "text", props: { content: "leaf" } };
      }
      prevId = id;
    }
    expectValid({
      version: "1.0",
      ui: { root: prevId, elements },
    });
  });
});
