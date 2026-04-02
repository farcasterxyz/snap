import { defineSchema } from "@json-render/core";

/**
 * json-render spec shape: flat `root` + `elements` map (see [json-render](https://json-render.dev/)).
 * Component `type` strings must match keys in {@link ./catalog.ts}.
 */
export const snapJsonRenderSchema = defineSchema(
  (s) => ({
    spec: s.object({
      root: s.string(),
      elements: s.record(
        s.object({
          type: s.ref("catalog.components"),
          props: s.propsOf("catalog.components"),
          children: { ...s.array(s.string()), optional: true },
        }),
      ),
    }),
    catalog: s.object({
      components: s.map({
        props: s.zod(),
        description: s.string(),
      }),
      actions: s.map({
        description: s.string(),
        params: { ...s.zod(), optional: true },
      }),
    }),
  }),
  {
    defaultRules: [
      "You are generating auxiliary UI for a Farcaster Snap. Prefer components matching snap element types (Text, Image, ButtonGroup, …).",
      "Snap pages use a Stack root with at most 5 body children and 1 media element (Image or Grid); keep generated trees small.",
      "Bottom-of-card snap buttons are ActionButton components; use actions post / link / mini_app / client.",
    ],
  },
);
