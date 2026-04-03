import { z } from "zod";
import type { Spec } from "@json-render/core";
import {
  EFFECT_VALUES,
  SPEC_VERSION,
} from "./constants";
import {
  DEFAULT_THEME_ACCENT,
  PALETTE_COLOR_VALUES,
} from "./colors";

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
// `spec` is a json-render Spec — validated by the catalog at runtime,
// typed here via the json-render Spec type.

export const snapResponseSchema = z
  .object({
    version: z.literal(SPEC_VERSION),
    theme: themeSchema.optional().default({ accent: DEFAULT_THEME_ACCENT }),
    effects: z.array(z.enum(EFFECT_VALUES)).optional(),
    spec: z.custom<Spec>(
      (val) =>
        val != null &&
        typeof val === "object" &&
        "root" in val &&
        "elements" in val,
      { message: "spec must be a json-render Spec with root and elements" },
    ),
  })
  .strict();

export type SnapResponse = z.infer<typeof snapResponseSchema>;
export type SnapHandlerResult = z.input<typeof snapResponseSchema>;

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
    button_index: z.number().int().nonnegative(),
    timestamp: z.number().int(),
  })
  .strict();

export type SnapPayload = z.infer<typeof payloadSchema>;

export const ACTION_TYPE_GET = "get" as const;
export const ACTION_TYPE_POST = "post" as const;

const snapGetActionSchema = z.object({
  type: z.literal(ACTION_TYPE_GET),
});

export type SnapGetAction = z.infer<typeof snapGetActionSchema>;

const snapPostActionSchema = payloadSchema
  .extend({
    type: z.literal(ACTION_TYPE_POST),
  })
  .strict();

export type SnapPostAction = z.infer<typeof snapPostActionSchema>;

export const snapActionSchema = z.discriminatedUnion("type", [
  snapGetActionSchema,
  snapPostActionSchema,
]);

export type SnapAction = z.infer<typeof snapActionSchema>;

export type DataStoreValue =
  | string
  | number
  | boolean
  | null
  | DataStoreValue[]
  | { [key: string]: DataStoreValue };

export type SnapDataStoreOperations = {
  get(key: string): Promise<DataStoreValue | null>;
  set(key: string, value: DataStoreValue): Promise<void>;
};

export type SnapDataStore = SnapDataStoreOperations & {
  withLock<T>(fn: (store: SnapDataStoreOperations) => Promise<T>): Promise<T>;
};

export function createDefaultDataStore(): SnapDataStore {
  const err = new Error(
    "Data store is not configured. Use withUpstash() from @farcaster/snap-upstash or provide a data store implementation.",
  );
  return {
    get(_key: string): Promise<never> {
      return Promise.reject(err);
    },
    set(_key: string, _value: DataStoreValue): Promise<never> {
      return Promise.reject(err);
    },
    withLock<T>(
      _fn: (store: SnapDataStoreOperations) => Promise<T>,
    ): Promise<never> {
      return Promise.reject(err);
    },
  };
}

export type SnapContext = {
  action: SnapAction;
  request: Request;
  data: SnapDataStore;
};

export type SnapFunction = (ctx: SnapContext) => Promise<SnapHandlerResult>;
