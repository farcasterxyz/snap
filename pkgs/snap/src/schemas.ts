import { z } from "zod";
import {
  BUTTON_LAYOUT_VALUES,
  DEFAULT_BUTTON_LAYOUT,
  EFFECT_VALUES,
  ELEMENT_TYPE,
  INTERACTIVE_ELEMENT_TYPES,
  LIMITS,
  MEDIA_ELEMENT_TYPES,
  SPEC_VERSION,
  TEXT_STYLE,
} from "./constants";
import { DEFAULT_THEME_ACCENT, PALETTE_COLOR_VALUES } from "./colors";
import { type SnapDataStore } from "./dataStore";
import { elementsSchema, buttonSchema } from "./elements";

const themeAccentSchema = z.enum(PALETTE_COLOR_VALUES, {
  message: `accent must be a palette color: ${PALETTE_COLOR_VALUES.join(", ")}`,
});

const themeSchema = z
  .object({
    accent: themeAccentSchema.default(DEFAULT_THEME_ACCENT),
  })
  .strict();

export const snapResponseSchema = z
  .object({
    version: z.literal(SPEC_VERSION),
    page: z
      .object({
        theme: themeSchema.optional().default({ accent: DEFAULT_THEME_ACCENT }),
        button_layout: z
          .enum(BUTTON_LAYOUT_VALUES)
          .default(DEFAULT_BUTTON_LAYOUT),
        effects: z.array(z.enum(EFFECT_VALUES)).optional(),
        elements: elementsSchema,
        buttons: z
          .array(buttonSchema)
          .max(LIMITS.maxButtonsPerPage, {
            message: `cannot have more than ${LIMITS.maxButtonsPerPage} buttons`,
          })
          .optional(),
      })
      .strict()
      .superRefine((page, ctx) => {
        const mediaCount = page.elements.children.filter((el) => {
          return MEDIA_ELEMENT_TYPES.includes(el.type);
        }).length;
        if (mediaCount > 1) {
          ctx.addIssue({
            code: "custom",
            message: `cannot have more than 1 media element (image or grid)`,
            path: ["elements", "children"],
          });
        }
      }),
  })
  .strict();

// canonical snap response type
export type SnapResponse = z.infer<typeof snapResponseSchema>;
// what snap handlers may return (keeps optional fields optional)
export type SnapHandlerResult = z.input<typeof snapResponseSchema>;

// extra constraints for the first page to make it look nicer
export const firstPageResponseSchema = snapResponseSchema.superRefine(
  (response, ctx) => {
    const elements = response.page.elements.children;

    const hasTextTitleOrBody = elements.some(
      (el) =>
        el.type === ELEMENT_TYPE.text &&
        (el.style === TEXT_STYLE.title || el.style === TEXT_STYLE.body),
    );
    if (!hasTextTitleOrBody) {
      ctx.addIssue({
        code: "custom",
        message:
          'first page must have at least one text element with style "title" or "body"',
        path: ["page", "elements", "children"],
      });
    }

    const hasInteractive = elements.some((el) =>
      INTERACTIVE_ELEMENT_TYPES.includes(el.type),
    );
    const hasMedia = elements.some((el) =>
      MEDIA_ELEMENT_TYPES.includes(el.type),
    );
    if (!hasInteractive && !hasMedia) {
      ctx.addIssue({
        code: "custom",
        message:
          "first page must have at least one interactive element (button_group, slider, text_input, toggle) or media element (image, grid)",
        path: ["page", "elements", "children"],
      });
    }
  },
);

export type FirstPageResponse = z.infer<typeof firstPageResponseSchema>;

const postInputValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z
    .object({
      row: z.number().int().nonnegative(),
      col: z.number().int().nonnegative(),
    })
    .strict(),
]);

export const payloadSchema = z
  .object({
    fid: z.number().int().nonnegative(),
    inputs: z.record(z.string(), postInputValueSchema).default({}),
    button_index: z.number().int().nonnegative(),
    /** Unix time in seconds (wire format matches spec examples). */
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

export type SnapContext = {
  action: SnapAction;
  request: Request;
  data: SnapDataStore;
};

export type SnapFunction = (ctx: SnapContext) => Promise<SnapHandlerResult>;
