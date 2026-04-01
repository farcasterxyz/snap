import { describe, it, expect } from "vitest";
import {
  BUTTON_GROUP_STYLE,
  DEFAULT_LIST_STYLE,
  DEFAULT_SLIDER_STEP,
  DEFAULT_THEME_ACCENT,
  SPACER_SIZE,
} from "../src/constants";
import { rootSchema } from "../src/schemas";
import { validatePage, validateFirstPage } from "../src/validator";

function stackRoot<T>(children: T[]) {
  return { type: "stack" as const, children };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Zod 4 issues use `path` as `(string | number)[]`; tests match legacy string form. */
function formatIssuePath(path: unknown): string {
  if (!Array.isArray(path)) return String(path ?? "");
  let s = "";
  for (const seg of path) {
    if (typeof seg === "number") s += `[${seg}]`;
    else s += s ? `.${String(seg)}` : String(seg);
  }
  return s;
}

function validMinimalPage() {
  return {
    version: "1.0",
    page: {
      elements: stackRoot([{ type: "text", style: "title", content: "Hello" }]),
    },
  };
}

function expectValid(json: unknown) {
  const result = validatePage(json);
  expect(result.valid).toBe(true);
  expect(result.issues).toHaveLength(0);
}

/** Each needle must appear in some error's code, path, or message (Zod-native output). */
function expectErrors(json: unknown, needles: string[]) {
  const result = validatePage(json);
  expect(result.valid).toBe(false);
  for (const needle of needles) {
    const ok = result.issues.some((e) => {
      const blob = `${e.code}\t${formatIssuePath(e.path)}\t${e.message}`;
      return blob.includes(needle);
    });
    expect(ok, `expected "${needle}" in ${JSON.stringify(result.issues)}`).toBe(
      true,
    );
  }
  return result;
}

function expectErrorCount(json: unknown, count: number) {
  const result = validatePage(json);
  expect(result.issues).toHaveLength(count);
  return result;
}

function hasCode(result: { issues: { code: string }[] }, code: string) {
  return result.issues.some((e) => e.code === code);
}

// ─── Top-level structure ────────────────────────────────────────────────────

describe("Top-level structure", () => {
  it("accepts a valid minimal page", () => {
    expectValid(validMinimalPage());
  });

  it("applies defaults for button_layout and theme when omitted", () => {
    const minimal = validMinimalPage();
    const parsed = rootSchema.parse(minimal);
    expect(parsed.page.button_layout).toBe("stack");
    expect(parsed.page.theme).toEqual({ accent: DEFAULT_THEME_ACCENT });
  });

  it("rejects non-object input", () => {
    const result = validatePage("not an object");
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe("invalid_type");
  });

  it("rejects null input", () => {
    const result = validatePage(null);
    expect(result.valid).toBe(false);
  });

  it("requires version", () => {
    expectErrors(
      {
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        },
      },
      ["invalid_value\tversion\t"],
    );
  });

  it("rejects invalid version", () => {
    expectErrors(
      {
        version: "2.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        },
      },
      ["invalid_value\tversion\t"],
    );
  });

  it("requires page", () => {
    expectErrors({ version: "1.0" }, ["invalid_type\tpage\t"]);
  });

  it("rejects non-object page", () => {
    expectErrors({ version: "1.0", page: "not an object" }, [
      "invalid_type\tpage\t",
    ]);
  });

  it("rejects unknown top-level keys", () => {
    const json = {
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
      },
      extra: true,
    };
    expectErrors(json, ["unrecognized_keys", "Unrecognized key"]);
  });
});

// ─── Theme ──────────────────────────────────────────────────────────────────

describe("Theme validation", () => {
  it("accepts valid palette accent name", () => {
    const json = validMinimalPage();
    (json.page as any).theme = { accent: "blue" };
    expectValid(json);
  });

  it("rejects hex accent (no longer accepted)", () => {
    const json = validMinimalPage();
    (json.page as any).theme = { accent: "#8B5CF6" };
    expectErrors(json, ["accent must be a palette color"]);
  });

  it("rejects non-object theme", () => {
    const json = validMinimalPage();
    (json.page as any).theme = "purple";
    expectErrors(json, ["page.theme", "expected object, received string"]);
  });

  it("rejects invalid accent color name", () => {
    const json = validMinimalPage();
    (json.page as any).theme = { accent: "not-a-color" };
    expectErrors(json, ["accent must be a palette color"]);
  });

  it("rejects accent that looks like hex", () => {
    const json = validMinimalPage();
    (json.page as any).theme = { accent: "8B5CF6" };
    expectErrors(json, ["accent must be a palette color"]);
  });

  it("accepts theme without accent (optional)", () => {
    const json = validMinimalPage();
    (json.page as any).theme = {};
    expectValid(json);
  });

  it("parses default theme accent when page omits theme", () => {
    const parsed = rootSchema.parse(validMinimalPage());
    expect(parsed.page.theme).toEqual({ accent: DEFAULT_THEME_ACCENT });
  });

  it("parses default theme accent when theme is empty object", () => {
    const parsed = rootSchema.parse({
      ...validMinimalPage(),
      page: { ...validMinimalPage().page, theme: {} },
    });
    expect(parsed.page.theme).toEqual({ accent: DEFAULT_THEME_ACCENT });
  });
});

// ─── Schema parse defaults (list, spacer, button_group, slider) ─────────────

describe("Schema parse defaults (list, spacer, button_group, slider)", () => {
  it("parses default list style when omitted", () => {
    const parsed = rootSchema.parse({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "list", items: [{ content: "x" }] }]),
      },
    });
    const el = parsed.page.elements.children[0];
    expect(el.type).toBe("list");
    if (el.type === "list") expect(el.style).toBe(DEFAULT_LIST_STYLE);
  });

  it("parses default spacer size when omitted", () => {
    const parsed = rootSchema.parse({
      version: "1.0",
      page: { elements: stackRoot([{ type: "spacer" }]) },
    });
    const el = parsed.page.elements.children[0];
    expect(el.type).toBe("spacer");
    if (el.type === "spacer") expect(el.size).toBe(SPACER_SIZE.medium);
  });

  it("parses default button_group style row for 2–3 options", () => {
    const parsed = rootSchema.parse({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "button_group", name: "x", options: ["A", "B"] },
        ]),
      },
    });
    const el = parsed.page.elements.children[0];
    expect(el.type).toBe("button_group");
    if (el.type === "button_group")
      expect(el.style).toBe(BUTTON_GROUP_STYLE.row);
  });

  it("parses default button_group style stack for 4 options", () => {
    const parsed = rootSchema.parse({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "button_group",
            name: "x",
            options: ["A", "B", "C", "D"],
          },
        ]),
      },
    });
    const el = parsed.page.elements.children[0];
    expect(el.type).toBe("button_group");
    if (el.type === "button_group")
      expect(el.style).toBe(BUTTON_GROUP_STYLE.stack);
  });

  it("parses default slider step when omitted", () => {
    const parsed = rootSchema.parse({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "slider", name: "x", min: 0, max: 100 }]),
      },
    });
    const el = parsed.page.elements.children[0];
    expect(el.type).toBe("slider");
    if (el.type === "slider") expect(el.step).toBe(DEFAULT_SLIDER_STEP);
  });
});

// ─── Page root (stack) ─────────────────────────────────────────────────────

describe("Page root (stack)", () => {
  it("requires page.elements", () => {
    expectErrors({ version: "1.0", page: {} }, [
      "page.elements",
      "expected object, received undefined",
    ]);
  });

  it("rejects empty stack children", () => {
    expectErrors({ version: "1.0", page: { elements: stackRoot([]) } }, [
      "stack must have at least 1",
    ]);
  });

  it("rejects more than 5 elements", () => {
    const elements = Array.from({ length: 6 }, () => ({
      type: "text",
      style: "title",
      content: "x",
    }));
    expectErrors({ version: "1.0", page: { elements: stackRoot(elements) } }, [
      "cannot have more than 5 elements",
    ]);
  });

  it("accepts exactly 5 elements", () => {
    const elements = Array.from({ length: 5 }, () => ({
      type: "text",
      style: "title",
      content: "x",
    }));
    expectValid({ version: "1.0", page: { elements: stackRoot(elements) } });
  });

  it("rejects more than 1 media element", () => {
    const elements = [
      { type: "image", url: "https://example.com/a.jpg", aspect: "1:1" },
      { type: "grid", cols: 2, rows: 2, cells: [] },
    ];
    expectErrors({ version: "1.0", page: { elements: stackRoot(elements) } }, [
      "cannot have more than 1 media",
    ]);
  });

  it("counts grid as media element", () => {
    const elements = [
      { type: "image", url: "https://example.com/a.jpg", aspect: "1:1" },
      { type: "grid", cols: 2, rows: 2, cells: [] },
    ];
    expectErrors({ version: "1.0", page: { elements: stackRoot(elements) } }, [
      "cannot have more than 1 media",
    ]);
  });

  it("rejects unknown element type", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "unknown_widget" }]) },
      },
      ["invalid_union", "page.elements.children[0].type"],
    );
  });

  it("rejects element without type", () => {
    expectErrors(
      { version: "1.0", page: { elements: stackRoot([{ content: "hello" }]) } },
      ["invalid_union", "page.elements.children[0].type"],
    );
  });
});

// ─── Text element ───────────────────────────────────────────────────────────

describe("Text element", () => {
  it("accepts valid text", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "text",
            style: "body",
            content: "Hello world",
            align: "center",
          },
        ]),
      },
    });
  });

  it("requires style", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "text", content: "x" }]) },
      },
      ["invalid_value\tpage.elements.children[0].style\t"],
    );
  });

  it("rejects invalid style", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "huge", content: "x" }]),
        },
      },
      ["invalid_value\tpage.elements.children[0].style\t"],
    );
  });

  it("requires content", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "text", style: "title" }]) },
      },
      ["invalid_type\tpage.elements.children[0].content\t"],
    );
  });

  it("enforces title max 80 chars", () => {
    const result = expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "x".repeat(81) },
          ]),
        },
      },
      ["character limit"],
    );
    expect(result.issues[0].message).toMatch(/80/);
  });

  it("enforces body max 160 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "body", content: "x".repeat(161) },
          ]),
        },
      },
      ["character limit"],
    );
  });

  it("enforces caption max 100 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "caption", content: "x".repeat(101) },
          ]),
        },
      },
      ["character limit"],
    );
  });

  it("enforces label max 40 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "label", content: "x".repeat(41) },
          ]),
        },
      },
      ["character limit"],
    );
  });

  it("accepts text at exact max length", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "x".repeat(80) },
        ]),
      },
    });
  });

  it("rejects invalid align", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "x", align: "justify" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].align\t"],
    );
  });
});

// ─── Image element ──────────────────────────────────────────────────────────

describe("Image element", () => {
  it("accepts valid image", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "image",
            url: "https://example.com/photo.jpg",
            aspect: "16:9",
            alt: "A photo",
          },
        ]),
      },
    });
  });

  it("requires url", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "image", aspect: "1:1" }]) },
      },
      ["invalid_type\tpage.elements.children[0].url\t"],
    );
  });

  it("requires https url", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "image", url: "http://example.com/a.jpg", aspect: "1:1" },
          ]),
        },
      },
      ["URL must use HTTPS"],
    );
  });

  it("rejects invalid aspect", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "image", url: "https://example.com/a.jpg", aspect: "2:1" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].aspect\t"],
    );
  });

  it("requires aspect", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "image", url: "https://example.com/a.jpg" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].aspect\t"],
    );
  });
});

// ─── Divider element ────────────────────────────────────────────────────────

describe("Divider element", () => {
  it("accepts divider", () => {
    expectValid({
      version: "1.0",
      page: { elements: stackRoot([{ type: "divider" }]) },
    });
  });
});

// ─── Spacer element ─────────────────────────────────────────────────────────

describe("Spacer element", () => {
  it("accepts valid spacer sizes", () => {
    for (const size of ["small", "medium", "large"]) {
      expectValid({
        version: "1.0",
        page: { elements: stackRoot([{ type: "spacer", size }]) },
      });
    }
  });

  it("accepts spacer without size (optional)", () => {
    expectValid({
      version: "1.0",
      page: { elements: stackRoot([{ type: "spacer" }]) },
    });
  });

  it("rejects invalid spacer size", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "spacer", size: "tiny" }]) },
      },
      ["invalid_value\tpage.elements.children[0].size\t"],
    );
  });
});

// ─── Progress element ───────────────────────────────────────────────────────

describe("Progress element", () => {
  it("accepts valid progress", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "progress",
            value: 72,
            max: 100,
            label: "72%",
            color: "accent",
          },
        ]),
      },
    });
  });

  it("requires value (number)", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "progress", max: 100 }]) },
      },
      ["invalid_type\tpage.elements.children[0].value\t"],
    );
  });

  it("requires max (number)", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "progress", value: 50 }]) },
      },
      ["invalid_type\tpage.elements.children[0].max\t"],
    );
  });

  it("rejects label > 60 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "progress", value: 50, max: 100, label: "x".repeat(61) },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].label\t"],
    );
  });

  it("rejects invalid color", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "progress", value: 50, max: 100, color: "neon" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].color\t"],
    );
  });

  it("rejects max <= 0", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "progress", value: 0, max: 0 }]) },
      },
      ["custom\tpage.elements.children[0].max\t"],
    );
  });

  it("rejects value below 0", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "progress", value: -1, max: 100 }]),
        },
      },
      ["custom\tpage.elements.children[0].value\t"],
    );
  });

  it("rejects value greater than max", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "progress", value: 101, max: 100 }]),
        },
      },
      ["custom\tpage.elements.children[0].value\t"],
    );
  });

  it("accepts value 0 and value equal to max", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "progress", value: 0, max: 100 },
          { type: "progress", value: 100, max: 100 },
        ]),
      },
    });
  });
});

// ─── List element ───────────────────────────────────────────────────────────

describe("List element", () => {
  it("accepts valid list", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "list",
            style: "ordered",
            items: [
              { content: "@dwr.eth", trailing: "8/10 (80%)" },
              { content: "@jessepollak", trailing: "7/10 (70%)" },
            ],
          },
        ]),
      },
    });
  });

  it("requires items", () => {
    expectErrors(
      { version: "1.0", page: { elements: stackRoot([{ type: "list" }]) } },
      ["invalid_type\tpage.elements.children[0].items\t"],
    );
  });

  it("rejects more than 4 items", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      content: `Item ${i}`,
    }));
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "list", items }]) },
      },
      ["too_big\tpage.elements.children[0].items\t"],
    );
  });

  it("requires item content", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "list", items: [{ trailing: "x" }] }]),
        },
      },
      ["invalid_type\tpage.elements.children[0].items[0].content\t"],
    );
  });

  it("rejects item content > 100 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "list", items: [{ content: "x".repeat(101) }] },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].items[0].content\t"],
    );
  });

  it("rejects item trailing > 40 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "list",
              items: [{ content: "item", trailing: "x".repeat(41) }],
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].items[0].trailing\t"],
    );
  });

  it("rejects invalid list style", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "list", style: "fancy", items: [{ content: "item" }] },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].style\t"],
    );
  });
});

// ─── Grid element ───────────────────────────────────────────────────────────

describe("Grid element", () => {
  it("accepts valid grid", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "grid",
            cols: 5,
            rows: 6,
            cellSize: "square",
            gap: "small",
            cells: [{ row: 0, col: 0, color: "#22C55E", content: "C" }],
          },
        ]),
      },
    });
  });

  it("rejects grid cell color that is not 6-digit hex", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "grid",
              cols: 2,
              rows: 2,
              cells: [{ row: 0, col: 0, color: "#ABC", content: "x" }],
            },
          ]),
        },
      },
      ["cell color must be a valid 6-digit hex"],
    );
  });

  it("rejects cols < 2", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "grid", cols: 1, rows: 2, cells: [] }]),
        },
      },
      ["too_small\tpage.elements.children[0].cols\t"],
    );
  });

  it("rejects cols > 64", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "grid", cols: 65, rows: 2, cells: [] }]),
        },
      },
      ["too_big\tpage.elements.children[0].cols\t"],
    );
  });

  it("rejects rows < 2", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "grid", cols: 2, rows: 1, cells: [] }]),
        },
      },
      ["too_small\tpage.elements.children[0].rows\t"],
    );
  });

  it("rejects rows > 8", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "grid", cols: 2, rows: 9, cells: [] }]),
        },
      },
      ["too_big\tpage.elements.children[0].rows\t"],
    );
  });

  it("requires cells", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "grid", cols: 2, rows: 2 }]) },
      },
      ["invalid_type\tpage.elements.children[0].cells\t"],
    );
  });

  it("rejects cell row out of bounds", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "grid", cols: 3, rows: 3, cells: [{ row: 5, col: 0 }] },
          ]),
        },
      },
      ["out of bounds"],
    );
  });

  it("rejects cell col out of bounds", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "grid", cols: 3, rows: 3, cells: [{ row: 0, col: 5 }] },
          ]),
        },
      },
      ["out of bounds"],
    );
  });

  it("rejects invalid cellSize", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "grid", cols: 2, rows: 2, cells: [], cellSize: "huge" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].cellSize\t"],
    );
  });

  it("rejects invalid gap", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "grid", cols: 2, rows: 2, cells: [], gap: "large" },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].gap\t"],
    );
  });
});

// ─── Text input element ─────────────────────────────────────────────────────

describe("Text input element", () => {
  it("accepts valid text_input", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "text_input",
            name: "guess",
            placeholder: "Type here...",
            maxLength: 5,
          },
        ]),
      },
    });
  });

  it("requires name", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "text_input" }]) },
      },
      ["invalid_type\tpage.elements.children[0].name\t"],
    );
  });

  it("rejects empty name", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "text_input", name: "" }]) },
      },
      ["too_small\tpage.elements.children[0].name\t"],
    );
  });

  it("rejects placeholder > 60 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text_input", name: "x", placeholder: "x".repeat(61) },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].placeholder\t"],
    );
  });

  it("rejects maxLength > 280", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text_input", name: "x", maxLength: 300 },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].maxLength\t"],
    );
  });

  it("accepts maxLength = 280", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text_input", name: "x", maxLength: 280 },
        ]),
      },
    });
  });
});

// ─── Slider element ─────────────────────────────────────────────────────────

describe("Slider element", () => {
  it("accepts valid slider", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "slider",
            name: "estimate",
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            label: "Your estimate",
            minLabel: "Low",
            maxLabel: "High",
          },
        ]),
      },
    });
  });

  it("requires name", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "slider", min: 0, max: 100 }]) },
      },
      ["invalid_type\tpage.elements.children[0].name\t"],
    );
  });

  it("requires min", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "slider", name: "x", max: 100 }]),
        },
      },
      ["invalid_type\tpage.elements.children[0].min\t"],
    );
  });

  it("requires max", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "slider", name: "x", min: 0 }]) },
      },
      ["invalid_type\tpage.elements.children[0].max\t"],
    );
  });

  it("rejects label > 60 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "slider",
              name: "x",
              min: 0,
              max: 100,
              label: "x".repeat(61),
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].label\t"],
    );
  });

  it("rejects minLabel > 20 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "slider",
              name: "x",
              min: 0,
              max: 100,
              minLabel: "x".repeat(21),
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].minLabel\t"],
    );
  });

  it("rejects maxLabel > 20 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "slider",
              name: "x",
              min: 0,
              max: 100,
              maxLabel: "x".repeat(21),
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].maxLabel\t"],
    );
  });

  it("rejects min greater than max", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "slider", name: "x", min: 10, max: 5 }]),
        },
      },
      ["custom\tpage.elements.children[0].min\t"],
    );
  });

  it("rejects non-positive step", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "slider", name: "x", min: 0, max: 100, step: 0 },
          ]),
        },
      },
      ["custom\tpage.elements.children[0].step\t"],
    );
  });

  it("rejects value outside min/max", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "slider", name: "x", min: 0, max: 100, value: 101 },
          ]),
        },
      },
      ["custom\tpage.elements.children[0].value\t"],
    );
  });

  it("rejects value not on step grid from min", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "slider",
              name: "x",
              min: 0,
              max: 100,
              step: 2,
              value: 51,
            },
          ]),
        },
      },
      ["not reachable"],
    );
  });

  it("accepts min equal to max with matching value", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "slider", name: "x", min: 5, max: 5, value: 5 },
        ]),
      },
    });
  });

  it("accepts value without step (range only)", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "slider", name: "x", min: 0, max: 100, value: 33 },
        ]),
      },
    });
  });
});

// ─── Button group element ───────────────────────────────────────────────────

describe("Button group element", () => {
  it("accepts valid button_group", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "button_group",
            name: "vote",
            options: ["Tabs", "Spaces"],
            style: "row",
          },
        ]),
      },
    });
  });

  it("requires name", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "button_group", options: ["A", "B"] }]),
        },
      },
      ["invalid_type\tpage.elements.children[0].name\t"],
    );
  });

  it("requires options", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "button_group", name: "x" }]) },
      },
      ["invalid_type\tpage.elements.children[0].options\t"],
    );
  });

  it("rejects fewer than 2 options", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "button_group", name: "x", options: ["only one"] },
          ]),
        },
      },
      ["too_small\tpage.elements.children[0].options\t"],
    );
  });

  it("rejects more than 4 options", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "button_group",
              name: "x",
              options: ["A", "B", "C", "D", "E"],
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].options\t"],
    );
  });

  it("rejects option > 40 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "button_group",
              name: "x",
              options: ["ok", "x".repeat(41)],
            },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].options[1]\t"],
    );
  });

  it("rejects invalid style", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            {
              type: "button_group",
              name: "x",
              options: ["A", "B"],
              style: "carousel",
            },
          ]),
        },
      },
      ["invalid_value\tpage.elements.children[0].style\t"],
    );
  });
});

// ─── Toggle element ─────────────────────────────────────────────────────────

describe("Toggle element", () => {
  it("accepts valid toggle", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          {
            type: "toggle",
            name: "notifications",
            label: "Enable reminders",
            value: false,
          },
        ]),
      },
    });
  });

  it("requires name", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "toggle", label: "x" }]) },
      },
      ["invalid_type\tpage.elements.children[0].name\t"],
    );
  });

  it("requires label", () => {
    expectErrors(
      {
        version: "1.0",
        page: { elements: stackRoot([{ type: "toggle", name: "x" }]) },
      },
      ["invalid_type\tpage.elements.children[0].label\t"],
    );
  });

  it("rejects label > 60 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "toggle", name: "x", label: "x".repeat(61) },
          ]),
        },
      },
      ["too_big\tpage.elements.children[0].label\t"],
    );
  });
});

// ─── Buttons ────────────────────────────────────────────────────────────────

describe("Buttons validation", () => {
  it("accepts valid buttons", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        buttons: [
          {
            label: "Submit",
            action: "post",
            target: "https://example.com/submit",
          },
          {
            label: "Learn more",
            action: "link",
            target: "https://example.com",
            style: "secondary",
          },
        ],
      },
    });
  });

  it("rejects more than 4 buttons", () => {
    const buttons = Array.from({ length: 5 }, (_, i) => ({
      label: `B${i}`,
      action: "post",
      target: "https://example.com",
    }));
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons,
        },
      },
      ["cannot have more than 4 buttons"],
    );
  });

  it("requires button label", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [{ action: "post", target: "https://example.com" }],
        },
      },
      ["invalid_type\tpage.buttons[0].label\t"],
    );
  });

  it("rejects label > 30 chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            {
              label: "x".repeat(31),
              action: "post",
              target: "https://example.com",
            },
          ],
        },
      },
      ["too_big\tpage.buttons[0].label\t"],
    );
  });

  it("requires action", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [{ label: "Go", target: "https://example.com" }],
        },
      },
      ["invalid_value\tpage.buttons[0].action\t"],
    );
  });

  it("rejects invalid action", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            { label: "Go", action: "redirect", target: "https://example.com" },
          ],
        },
      },
      ["invalid_value\tpage.buttons[0].action\t"],
    );
  });

  it("requires target", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [{ label: "Go", action: "post" }],
        },
      },
      ["invalid_type\tpage.buttons[0].target\t"],
    );
  });

  it("requires https target for post action", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            { label: "Go", action: "post", target: "http://example.com" },
          ],
        },
      },
      ["HTTPS", "localhost"],
    );
  });

  it("allows http loopback target for post action (local dev)", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        buttons: [
          {
            label: "Refresh",
            action: "post",
            target: "http://localhost:3014/snap",
          },
        ],
      },
    });
  });

  it("requires https target for link action", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            { label: "Go", action: "link", target: "http://example.com" },
          ],
        },
      },
      ["HTTPS"],
    );
  });

  it("requires https target for mini_app action", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            { label: "Go", action: "mini_app", target: "http://example.com" },
          ],
        },
      },
      ["HTTPS"],
    );
  });

  it("allows non-https target for sdk action", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        buttons: [
          { label: "Follow", action: "sdk", target: "user:follow:12345" },
        ],
      },
    });
  });

  it("rejects invalid button style", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
          buttons: [
            {
              label: "Go",
              action: "post",
              target: "https://example.com",
              style: "danger",
            },
          ],
        },
      },
      ["invalid_value\tpage.buttons[0].style\t"],
    );
  });
});

// ─── Multiple errors ────────────────────────────────────────────────────────

describe("Multiple errors", () => {
  it("returns all errors at once, not just the first", () => {
    const result = validatePage({
      version: "2.0",
      page: {
        theme: "bad",
        elements: stackRoot([{ type: "text" }, { type: "unknown_widget" }]),
        buttons: [{ label: "x".repeat(31) }],
      },
      extra_key: true,
    });

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(5);

    const blob = result.issues
      .map((e) => `${e.code}\t${formatIssuePath(e.path)}\t${e.message}`)
      .join("\n");
    expect(blob).toContain("invalid_value\tversion\t");
    expect(blob).toContain("unrecognized_keys");
    expect(blob).toContain("invalid_type\tpage.theme\t");
    expect(blob).toContain("expected object, received string");
    expect(blob).toContain("invalid_value\tpage.elements.children[0].style\t");
    expect(blob).toContain("invalid_type\tpage.elements.children[0].content\t");
    expect(blob).toContain("invalid_union\tpage.elements.children[1].type\t");
    expect(blob).toContain("too_big\tpage.buttons[0].label\t");
    expect(blob).toContain("invalid_value\tpage.buttons[0].action\t");
    expect(blob).toContain("invalid_type\tpage.buttons[0].target\t");
  });
});

// ─── First page validation ──────────────────────────────────────────────────

describe("First page validation", () => {
  it("accepts valid first page with text + interactive", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Vote!" },
          { type: "button_group", name: "vote", options: ["A", "B"] },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts valid first page with text + image", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "body", content: "Look at this" },
          { type: "image", url: "https://example.com/a.jpg", aspect: "16:9" },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects first page without text title/body", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "caption", content: "Just a caption" },
          { type: "button_group", name: "vote", options: ["A", "B"] },
        ]),
      },
    });
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (e) =>
          e.code === "custom" &&
          e.message.includes("title") &&
          e.message.includes("body"),
      ),
    ).toBe(true);
  });

  it("rejects first page without interactive or media", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Hello" },
          { type: "divider" },
        ]),
      },
    });
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (e) =>
          e.code === "custom" &&
          e.message.includes("interactive") &&
          e.message.includes("media"),
      ),
    ).toBe(true);
  });

  it("accepts first page with text + grid (media)", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Wordle" },
          {
            type: "grid",
            cols: 5,
            rows: 6,
            cells: [{ row: 0, col: 0, content: "A" }],
          },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts first page with slider (interactive)", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "How much?" },
          { type: "slider", name: "val", min: 0, max: 100 },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts first page with toggle (interactive)", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Settings" },
          { type: "toggle", name: "notif", label: "Enable" },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts first page with text_input (interactive)", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "body", content: "What do you think?" },
          { type: "text_input", name: "response" },
        ]),
      },
    });
    expect(result.valid).toBe(true);
  });

  it("includes both regular and first-page errors", () => {
    const result = validateFirstPage({
      version: "1.0",
      page: { elements: stackRoot([{ type: "spacer" }]) },
    });
    expect(result.valid).toBe(false);
    const msgs = result.issues.map((e) => e.message).join("\n");
    expect(msgs).toMatch(/title.*body|body.*title/s);
    expect(msgs).toContain("interactive");
    expect(msgs).toContain("media");
  });
});

// ─── Wordle example from spec ───────────────────────────────────────────────

describe("Spec examples", () => {
  it("validates Wordle first page from spec", () => {
    const wordle = {
      version: "1.0",
      page: {
        theme: { accent: "green" },
        elements: {
          type: "stack" as const,
          children: [
            {
              type: "text",
              style: "title",
              content: "Daily Wordle \u00B7 Day 12",
            },
            {
              type: "grid",
              cols: 5,
              rows: 6,
              cellSize: "square",
              gap: "small",
              cells: [
                { row: 0, col: 0, color: "#CA8A04", content: "C" },
                { row: 0, col: 1, color: "#6B7280", content: "R" },
                { row: 0, col: 2, color: "#22C55E", content: "A" },
                { row: 0, col: 3, color: "#6B7280", content: "N" },
                { row: 0, col: 4, color: "#6B7280", content: "E" },
              ],
            },
            {
              type: "text_input",
              name: "guess",
              placeholder: "Type 5-letter word...",
              maxLength: 5,
            },
            {
              type: "text",
              style: "caption",
              content: "1,247 guesses today \u00B7 Attempt 4/6",
            },
          ],
        },
        buttons: [
          {
            label: "Submit guess",
            action: "post",
            target: "https://wordle.example.com/guess",
          },
        ],
      },
    };

    // Regular validation
    const result = validatePage(wordle);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);

    // First page validation
    const firstResult = validateFirstPage(wordle);
    expect(firstResult.valid).toBe(true);
    expect(firstResult.issues).toHaveLength(0);
  });

  it("validates Wordle response page from spec", () => {
    const wordleResponse = {
      version: "1.0",
      page: {
        theme: { accent: "green" },
        elements: {
          type: "stack" as const,
          children: [
            {
              type: "text",
              style: "title",
              content: "Daily Wordle \u00B7 Day 12",
            },
            {
              type: "grid",
              cols: 5,
              rows: 6,
              cellSize: "square",
              gap: "small",
              cells: [
                { row: 0, col: 0, color: "#CA8A04", content: "C" },
                { row: 0, col: 1, color: "#6B7280", content: "R" },
                { row: 0, col: 2, color: "#22C55E", content: "A" },
                { row: 0, col: 3, color: "#6B7280", content: "N" },
                { row: 0, col: 4, color: "#6B7280", content: "E" },
                { row: 3, col: 0, color: "#22C55E", content: "C" },
                { row: 3, col: 1, color: "#22C55E", content: "L" },
                { row: 3, col: 2, color: "#22C55E", content: "A" },
                { row: 3, col: 3, color: "#22C55E", content: "S" },
                { row: 3, col: 4, color: "#22C55E", content: "S" },
              ],
            },
            {
              type: "text",
              style: "body",
              content: "Your guess has been submitted!",
              align: "center",
            },
            {
              type: "text",
              style: "caption",
              content:
                "The crowd's most popular guess will be locked in at 6pm",
            },
          ],
        },
        buttons: [
          {
            label: "Open full game",
            action: "mini_app",
            target: "https://wordle.example.com/app",
          },
        ],
      },
    };

    const result = validatePage(wordleResponse);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("validates This or That first page from spec", () => {
    const thisOrThat = {
      version: "1.0",
      page: {
        theme: { accent: "blue" },
        elements: {
          type: "stack" as const,
          children: [
            { type: "text", style: "title", content: "Startup dilemmas" },
            {
              type: "text",
              style: "caption",
              content: "by @dwr.eth \u00B7 3.1k voted",
            },
            {
              type: "button_group",
              name: "vote",
              options: [
                "Move fast, break things",
                "Move deliberately, build trust",
              ],
              style: "stack",
            },
          ],
        },
        buttons: [
          {
            label: "Vote",
            action: "post",
            target: "https://example.com/thisorthat/vote",
          },
        ],
      },
    };

    const result = validatePage(thisOrThat);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);

    const firstResult = validateFirstPage(thisOrThat);
    expect(firstResult.valid).toBe(true);
  });

  it("validates This or That response page from spec (5 elements)", () => {
    // The spec example has 6 elements, but max is 5.
    // We'll test a valid 5-element version.
    const thisOrThatResponse = {
      version: "1.0",
      page: {
        theme: { accent: "blue" },
        elements: {
          type: "stack" as const,
          children: [
            { type: "text", style: "title", content: "Startup dilemmas" },
            {
              type: "text",
              style: "label",
              content: "Move fast, break things",
            },
            {
              type: "progress",
              value: 38,
              max: 100,
              label: "38%",
              color: "accent",
            },
            {
              type: "text",
              style: "label",
              content: "Move deliberately, build trust",
            },
            {
              type: "progress",
              value: 62,
              max: 100,
              label: "62%",
              color: "green",
            },
          ],
        },
        buttons: [
          {
            label: "Next question",
            action: "post",
            target: "https://example.com/thisorthat/next",
          },
          {
            label: "Share results",
            action: "link",
            target: "https://example.com/thisorthat/share/abc123",
          },
        ],
      },
    };

    const result = validatePage(thisOrThatResponse);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("detects that the spec This or That response (6 elements) exceeds max", () => {
    // Exact spec example — has 6 elements, which exceeds the max 5 limit
    const thisOrThatResponseFromSpec = {
      version: "1.0",
      page: {
        theme: { accent: "blue" },
        elements: {
          type: "stack" as const,
          children: [
            { type: "text", style: "title", content: "Startup dilemmas" },
            {
              type: "text",
              style: "label",
              content: "Move fast, break things",
            },
            {
              type: "progress",
              value: 38,
              max: 100,
              label: "38%",
              color: "accent",
            },
            {
              type: "text",
              style: "label",
              content: "Move deliberately, build trust",
            },
            {
              type: "progress",
              value: 62,
              max: 100,
              label: "62%",
              color: "green",
            },
            {
              type: "text",
              style: "caption",
              content: "You voted with 62% of people \u00B7 3,102 votes",
            },
          ],
        },
        buttons: [
          {
            label: "Next question",
            action: "post",
            target: "https://example.com/thisorthat/next",
          },
          {
            label: "Share results",
            action: "link",
            target: "https://example.com/thisorthat/share/abc123",
          },
        ],
      },
    };

    const result = validatePage(thisOrThatResponseFromSpec);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((e) => e.message.includes("cannot have more than 5")),
    ).toBe(true);
  });
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles elements that are not objects", () => {
    const result = validatePage({
      version: "1.0",
      page: { elements: stackRoot([42, "text", null]) },
    });
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((e) =>
        e.message.includes("expected object, received number"),
      ),
    ).toBe(true);
  });

  it("handles missing fields gracefully", () => {
    const result = validatePage({
      version: "1.0",
      page: { elements: stackRoot([{ type: "slider" }]) },
    });
    expect(result.valid).toBe(false);
    const blob = result.issues
      .map((e) => `${e.code}\t${formatIssuePath(e.path)}\t${e.message}`)
      .join("\n");
    expect(blob).toContain("invalid_type\tpage.elements.children[0].name\t");
    expect(blob).toContain("invalid_type\tpage.elements.children[0].min\t");
    expect(blob).toContain("invalid_type\tpage.elements.children[0].max\t");
  });

  it("provides path info for nested errors", () => {
    const result = validatePage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "list", items: [{ content: "ok" }, { trailing: "x" }] },
        ]),
      },
    });
    const missing = result.issues.find(
      (e) =>
        formatIssuePath(e.path) ===
          "page.elements.children[0].items[1].content" &&
        e.code === "invalid_type",
    );
    expect(missing).toBeDefined();
    expect(formatIssuePath(missing!.path)).toBe(
      "page.elements.children[0].items[1].content",
    );
  });

  it("validates all elements in the array, not just the first", () => {
    const result = validatePage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "ok" },
          { type: "text", style: "title", content: "x".repeat(81) },
          { type: "text", style: "body", content: "x".repeat(161) },
        ]),
      },
    });
    expect(result.valid).toBe(false);
    const textTooLong = result.issues.filter(
      (e) => e.code === "custom" && e.message.includes("character limit"),
    );
    expect(textTooLong).toHaveLength(2);
  });

  it("validates all buttons, not just the first", () => {
    const result = validatePage({
      version: "1.0",
      page: {
        elements: stackRoot([{ type: "text", style: "title", content: "x" }]),
        buttons: [
          { label: "ok", action: "post", target: "https://example.com" },
          { label: "x".repeat(31), action: "post", target: "http://bad.com" },
        ],
      },
    });
    expect(result.valid).toBe(false);
    const blob = result.issues
      .map((e) => `${e.code}\t${formatIssuePath(e.path)}\t${e.message}`)
      .join("\n");
    expect(blob).toContain("too_big\tpage.buttons[1].label\t");
    expect(blob).toContain("HTTPS");
  });

  it("accepts page with no buttons (optional)", () => {
    expectValid(validMinimalPage());
  });

  it("accepts all valid element types", () => {
    // Each element type in its own valid page
    const elements: Record<string, unknown>[] = [
      { type: "text", style: "title", content: "x" },
      { type: "divider" },
      { type: "spacer" },
      { type: "list", items: [{ content: "item" }] },
      { type: "progress", value: 50, max: 100 },
    ];

    expectValid({ version: "1.0", page: { elements: stackRoot(elements) } });
  });

  it("error includes expected/received for length violations", () => {
    const result = validatePage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "x".repeat(81) },
        ]),
      },
    });
    const e = result.issues.find(
      (err) => err.code === "custom" && err.message.includes("character limit"),
    );
    expect(e).toBeDefined();
    expect(e!.message).toMatch(/80/);
    expect(e!.message).toMatch(/81/);
  });

  it("rejects grid with negative cell indices", () => {
    const result = validatePage({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "grid", cols: 3, rows: 3, cells: [{ row: -1, col: 0 }] },
        ]),
      },
    });
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (e) => e.code === "custom" && e.message.includes("out of bounds"),
      ),
    ).toBe(true);
  });
});

// ─── All element types combined ─────────────────────────────────────────────

describe("Comprehensive valid pages", () => {
  it("page with image and interactive elements", () => {
    expectValid({
      version: "1.0",
      page: {
        theme: { accent: "red" },
        elements: stackRoot([
          { type: "text", style: "title", content: "Rate this" },
          {
            type: "image",
            url: "https://example.com/photo.jpg",
            aspect: "16:9",
          },
          { type: "slider", name: "rating", min: 1, max: 5, label: "Rating" },
        ]),
        buttons: [
          {
            label: "Submit",
            action: "post",
            target: "https://example.com/rate",
          },
        ],
      },
    });
  });

  it("page with list and toggle", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "body", content: "Settings" },
          {
            type: "list",
            style: "plain",
            items: [
              { content: "Dark mode", trailing: "on" },
              { content: "Notifications", trailing: "off" },
            ],
          },
          { type: "toggle", name: "dark", label: "Dark mode" },
          { type: "toggle", name: "notif", label: "Notifications" },
        ]),
        buttons: [
          { label: "Save", action: "post", target: "https://example.com/save" },
        ],
      },
    });
  });
});

// ─── bar_chart ──────────────────────────────────────────────────────────────

describe("bar_chart element", () => {
  it("accepts a valid bar chart", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Fund Allocation" },
          {
            type: "bar_chart",
            bars: [
              { label: "Anthropic", value: 21 },
              { label: "Databricks", value: 18 },
              { label: "OpenAI", value: 10 },
            ],
          },
        ]),
      },
    });
  });

  it("accepts bar chart with max and color", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Poll Results" },
          {
            type: "bar_chart",
            bars: [
              { label: "Yes", value: 68 },
              { label: "No", value: 32 },
            ],
            max: 100,
            color: "green",
          },
        ]),
      },
    });
  });

  it("accepts bar chart with per-bar colors", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Results" },
          {
            type: "bar_chart",
            bars: [
              { label: "A", value: 50, color: "red" },
              { label: "B", value: 30, color: "green" },
            ],
          },
        ]),
      },
    });
  });

  it("rejects bar chart with no bars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "Empty" },
            { type: "bar_chart", bars: [] },
          ]),
        },
      },
      ["too_small"],
    );
  });

  it("rejects bar chart with more than 6 bars", () => {
    const bars = Array.from({ length: 7 }, (_, i) => ({
      label: `Bar ${i}`,
      value: i * 10,
    }));
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "Too many" },
            { type: "bar_chart", bars },
          ]),
        },
      },
      ["too_big"],
    );
  });

  it("rejects bar value exceeding max", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "Over max" },
            {
              type: "bar_chart",
              bars: [{ label: "A", value: 150 }],
              max: 100,
            },
          ]),
        },
      },
      ["exceeds chart max"],
    );
  });

  it("rejects negative bar value", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "Negative" },
            {
              type: "bar_chart",
              bars: [{ label: "A", value: -5 }],
            },
          ]),
        },
      },
      ["too_small"],
    );
  });

  it("rejects bar label exceeding max chars", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          elements: stackRoot([
            { type: "text", style: "title", content: "Long label" },
            {
              type: "bar_chart",
              bars: [{ label: "A".repeat(41), value: 10 }],
            },
          ]),
        },
      },
      ["too_big"],
    );
  });

  it("allows bar chart inside group", () => {
    expectValid({
      version: "1.0",
      page: {
        elements: stackRoot([
          { type: "text", style: "title", content: "Comparison" },
          {
            type: "group",
            layout: "row",
            children: [
              {
                type: "bar_chart",
                bars: [
                  { label: "A", value: 40 },
                  { label: "B", value: 60 },
                ],
              },
              {
                type: "bar_chart",
                bars: [
                  { label: "X", value: 25 },
                  { label: "Y", value: 75 },
                ],
              },
            ],
          },
        ]),
      },
    });
  });
});

// ─── Page effects ───────────────────────────────────────────────────────────

describe("Page effects", () => {
  it("accepts page with confetti effect", () => {
    expectValid({
      version: "1.0",
      page: {
        effects: ["confetti"],
        elements: stackRoot([
          { type: "text", style: "title", content: "You won!" },
          { type: "text", style: "body", content: "Congratulations!" },
        ]),
      },
    });
  });

  it("accepts page with no effects", () => {
    expectValid(validMinimalPage());
  });

  it("accepts page with empty effects array", () => {
    expectValid({
      version: "1.0",
      page: {
        effects: [],
        elements: stackRoot([
          { type: "text", style: "title", content: "Hello" },
        ]),
      },
    });
  });

  it("rejects unknown effect", () => {
    expectErrors(
      {
        version: "1.0",
        page: {
          effects: ["fireworks"],
          elements: stackRoot([
            { type: "text", style: "title", content: "Hello" },
          ]),
        },
      },
      ["invalid_value"],
    );
  });
});
