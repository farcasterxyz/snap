import type { Spec } from "@json-render/core";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapLike = {
  page: {
    theme?: { accent?: string };
    elements: { type: string; children: Array<Record<string, JsonValue>> };
    buttons?: Array<Record<string, JsonValue>>;
    button_layout?: "stack" | "row" | "grid";
  };
};

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function resetIds(): void {
  idCounter = 0;
}

function stripType(el: Record<string, JsonValue>): Record<string, JsonValue> {
  const { type: _t, ...rest } = el;
  return rest;
}

function snapActionToCatalogAction(
  action: string,
): "snap_post" | "snap_link" | "snap_mini_app" | "snap_sdk" {
  switch (action) {
    case "post":
      return "snap_post";
    case "link":
      return "snap_link";
    case "mini_app":
      return "snap_mini_app";
    case "sdk":
      return "snap_sdk";
    default:
      return "snap_link";
  }
}

function collectInputDefaults(
  el: Record<string, JsonValue>,
  inputs: Record<string, JsonValue>,
): void {
  const t = String(el.type ?? "");
  if (t === "text_input") {
    const name = String(el.name ?? "input");
    inputs[name] = "";
  }
  if (t === "slider") {
    const name = String(el.name ?? "slider");
    const min = Number(el.min ?? 0);
    const max = Number(el.max ?? 100);
    const mid = (min + max) / 2;
    inputs[name] = el.value !== undefined ? Number(el.value) : mid;
  }
  if (t === "toggle") {
    const name = String(el.name ?? "toggle");
    inputs[name] = Boolean(el.value ?? false);
  }
  if (t === "button_group") {
    const name = String(el.name ?? "choice");
    inputs[name] = "";
  }
  if (t === "group" && Array.isArray(el.children)) {
    for (const c of el.children) {
      collectInputDefaults(c as Record<string, JsonValue>, inputs);
    }
  }
}

/**
 * Turn snap `page` JSON into a json-render {@link Spec} for {@link snapJsonRenderCatalog},
 * plus initial state (`inputs`, `theme.accent`).
 */
export function snapPageToJsonRenderSpec(snap: SnapLike): {
  spec: Spec;
  initialState: Record<string, unknown>;
} {
  resetIds();
  const elements: Spec["elements"] = {};

  const inputs: Record<string, JsonValue> = {};
  const body = snap.page.elements?.children;
  if (!Array.isArray(body)) {
    throw new Error("Snap page.elements.children must be an array");
  }
  for (const el of body) {
    collectInputDefaults(el, inputs);
  }

  function convertSubtree(el: Record<string, JsonValue>): string {
    const t = String(el.type ?? "");

    if (t === "group" && Array.isArray(el.children)) {
      const gid = nextId("g");
      const childIds = (el.children as Record<string, JsonValue>[]).map((c) =>
        convertSubtree(c),
      );
      elements[gid] = {
        type: "Group",
        props: { layout: "row" },
        children: childIds,
      };
      return gid;
    }

    const catalogTypeMap: Record<string, string> = {
      text: "Text",
      image: "Image",
      divider: "Divider",
      spacer: "Spacer",
      progress: "Progress",
      list: "List",
      grid: "Grid",
      text_input: "TextInput",
      slider: "Slider",
      button_group: "ButtonGroup",
      toggle: "Toggle",
      bar_chart: "BarChart",
    };

    const id = nextId("e");
    const catalogType = catalogTypeMap[t];

    if (!catalogType) {
      elements[id] = {
        type: "Text",
        props: {
          style: "caption",
          content: `Unsupported element type: ${t || "(missing)"}`,
        },
        children: [],
      };
      return id;
    }

    elements[id] = {
      type: catalogType,
      props: stripType(el) as Record<string, unknown>,
      children: [],
    } as Spec["elements"][string];
    return id;
  }

  const contentIds = body.map((el) => convertSubtree(el));
  const stackChildren = [...contentIds];

  const buttons = snap.page.buttons ?? [];
  const layout = snap.page.button_layout ?? "stack";

  if (buttons.length > 0) {
    const buttonIds: string[] = [];
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const bid = nextId("btn");
      const label = String(btn.label ?? `Button ${i + 1}`);
      const action = String(btn.action ?? "post");
      const target = String(btn.target ?? "");
      const style = btn.style === "secondary" ? "secondary" : "primary";
      const catalogAction = snapActionToCatalogAction(action);

      const params: Record<string, unknown> =
        catalogAction === "snap_post"
          ? {
              buttonIndex: i,
              target,
              label,
              style,
            }
          : { target };

      elements[bid] = {
        type: "ActionButton",
        props: {
          label,
          action,
          target,
          style,
        },
        on: {
          press: { action: catalogAction, params },
        },
        children: [],
      };
      buttonIds.push(bid);
    }

    if (layout === "row" || layout === "grid") {
      const gid = nextId("btnrow");
      elements[gid] = {
        type: "Group",
        props: { layout: "row" },
        children: buttonIds,
      };
      stackChildren.push(gid);
    } else {
      for (let i = 0; i < buttonIds.length - 1; i++) {
        const cur = buttonIds[i]!;
        elements[cur]!.children = [buttonIds[i + 1]!];
      }
      stackChildren.push(buttonIds[0]!);
    }
  }

  const stackId = nextId("stack");
  elements[stackId] = {
    type: "Stack",
    props: {},
    children: stackChildren,
  };

  const accent = snap.page.theme?.accent ?? "purple";

  return {
    spec: { root: stackId, elements },
    initialState: {
      inputs,
      theme: { accent },
    },
  };
}
