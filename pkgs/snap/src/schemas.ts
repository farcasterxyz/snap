import { z } from "zod";
import type { Spec } from "@json-render/core";
import { EFFECT_VALUES, SUPPORTED_SPEC_VERSIONS, type SpecVersion } from "./constants";
import { DEFAULT_THEME_ACCENT, PALETTE_COLOR_VALUES } from "./colors";

// ─── Theme ─────────────────────────────────────────────

const themeAccentSchema = z.enum(PALETTE_COLOR_VALUES, {
  message: `accent must be a palette color: ${PALETTE_COLOR_VALUES.join(", ")}`,
});

const themeSchema = z
  .object({
    accent: themeAccentSchema.default(DEFAULT_THEME_ACCENT),
  })
  .strict();

// ─── Snap response ─────────────────────────────────────
// `ui` is a json-render Spec — validated by the catalog at runtime,
// typed here via the json-render Spec type.

export const snapResponseSchema = z
  .object({
    version: z.enum(SUPPORTED_SPEC_VERSIONS),
    theme: themeSchema.optional().default({ accent: DEFAULT_THEME_ACCENT }),
    effects: z.array(z.enum(EFFECT_VALUES)).optional(),
    ui: z.custom<Spec>(
      (val) =>
        val != null &&
        typeof val === "object" &&
        "root" in val &&
        "elements" in val,
      { message: "ui must be a json-render Spec with root and elements" },
    ),
  })
  .strict();

export type SnapResponse = z.infer<typeof snapResponseSchema>;

/**
 * Permissive element input type for snap handler authors.
 * Allows dynamic element construction without requiring exact UIElement types.
 */
export type SnapElementInput = {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
  on?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Permissive input type for the `ui` field in snap handler return values.
 * Accepts dynamically-built element maps (e.g. `Record<string, SnapElementInput>`)
 * without requiring exact UIElement types.
 */
export type SnapSpecInput = {
  root: string;
  elements: Record<string, SnapElementInput>;
  state?: Record<string, unknown>;
};

/**
 * Return type for snap handler functions.
 * Uses permissive input types so handlers can build elements dynamically
 * without type casts. Runtime validation via the Zod schema still catches invalid shapes.
 */
export type SnapHandlerResult = {
  version: SpecVersion;
  theme?: { accent?: z.input<typeof themeAccentSchema> };
  effects?: z.input<typeof snapResponseSchema>["effects"];
  ui: SnapSpecInput;
};

// ─── POST payload ──────────────────────────────────────

const postInputValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

export const payloadSchema = z
  .object({
    fid: z.number().int().nonnegative(),
    inputs: z.record(z.string(), postInputValueSchema).default({}),
    timestamp: z.number().int(),
    nonce: z.string(),
    audience: z.string(),
  })
  .strip();

export type SnapPayload = z.infer<typeof payloadSchema>;

export const ACTION_TYPE_GET = "get" as const;
export const ACTION_TYPE_POST = "post" as const;

const snapGetActionSchema = z.object({
  type: z.literal(ACTION_TYPE_GET),
});

export type SnapGetAction = z.infer<typeof snapGetActionSchema>;

const snapPostActionSchema = payloadSchema.extend({
  type: z.literal(ACTION_TYPE_POST),
});

export type SnapPostAction = z.infer<typeof snapPostActionSchema>;

export const snapActionSchema = z.discriminatedUnion("type", [
  snapGetActionSchema,
  snapPostActionSchema,
]);

export type SnapAction = z.infer<typeof snapActionSchema>;

export type SnapContext = {
  action: SnapAction;
  request: Request;
};

export type SnapFunction = (ctx: SnapContext) => Promise<SnapHandlerResult>;
