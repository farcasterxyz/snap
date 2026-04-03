import { z } from "zod";
import {
  BUTTON_ACTION,
  BUTTON_ACTION_VALUES,
  BUTTON_GROUP_STYLE,
  BUTTON_GROUP_STYLE_VALUES,
  BUTTON_STYLE_VALUES,
  DEFAULT_GRID_GAP,
  DEFAULT_LIST_STYLE,
  DEFAULT_SLIDER_STEP,
  ELEMENT_TYPE,
  GRID_CELL_SIZE_VALUES,
  GRID_GAP_VALUES,
  GROUP_LAYOUT_VALUES,
  HEX_COLOR_6_RE,
  HTTP_PREFIX,
  HTTPS_PREFIX,
  IMAGE_ASPECT_VALUES,
  LIMITS,
  LIST_STYLE_VALUES,
  PAGE_ROOT_TYPE,
  SLIDER_STEP_ALIGN_EPS,
  SPACER_SIZE,
  SPACER_SIZE_VALUES,
  TEXT_ALIGN_VALUES,
  TEXT_CONTENT_MAX,
  TEXT_STYLE_VALUES,
} from "./constants";
import {
  BAR_CHART_COLOR_VALUES,
  PALETTE_COLOR_VALUES,
  PROGRESS_COLOR_VALUES,
} from "./colors";
import { clientActionSchema } from "./actions";

/**
 * post/link/mini_app targets must be HTTPS in production; allow HTTP only for
 * loopback hosts so local snap servers (e.g. http://localhost:3014/snap) validate.
 */
function isSecureOrLoopbackHttpButtonTarget(target: string): boolean {
  if (target.startsWith(HTTPS_PREFIX)) return true;
  if (!target.startsWith(HTTP_PREFIX)) return false;
  try {
    const u = new URL(target);
    if (u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1"
    );
  } catch {
    return false;
  }
}

const imageUrlSchema = z.string().refine((s) => s.startsWith(HTTPS_PREFIX), {
  message: "image URL must use HTTPS",
});

const textAlignSchema = z.enum(TEXT_ALIGN_VALUES);

const textElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.text),
    style: z.enum(TEXT_STYLE_VALUES),
    content: z.string(),
    align: textAlignSchema.optional(),
  })
  .superRefine((val, ctx) => {
    const max = TEXT_CONTENT_MAX[val.style];
    if (val.content.length > max) {
      ctx.addIssue({
        code: "custom",
        message: `${val.style} text exceeds ${max} character limit (found ${val.content.length})`,
        path: ["content"],
      });
    }
  });

const imageElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.image),
  url: imageUrlSchema,
  aspect: z.enum(IMAGE_ASPECT_VALUES),
  alt: z.string().optional(),
});

const dividerElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.divider),
});

const spacerElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.spacer),
  size: z.enum(SPACER_SIZE_VALUES).default(SPACER_SIZE.medium),
});

const progressElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.progress),
    value: z.number(),
    max: z.number(),
    label: z.string().max(60).optional(),
    color: z.enum(PROGRESS_COLOR_VALUES).optional(),
  })
  .superRefine((val, ctx) => {
    const { value, max } = val;
    if (!Number.isFinite(max)) {
      ctx.addIssue({
        code: "custom",
        message: "progress max must be a finite number",
        path: ["max"],
      });
      return;
    }
    if (max <= 0) {
      ctx.addIssue({
        code: "custom",
        message: `progress max must be greater than 0 (received ${max})`,
        path: ["max"],
      });
      return;
    }
    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: "custom",
        message: "progress value must be a finite number",
        path: ["value"],
      });
      return;
    }
    if (value < 0 || value > max) {
      ctx.addIssue({
        code: "custom",
        message: `progress value (${value}) must be between 0 and max (${max})`,
        path: ["value"],
      });
    }
  });

const listItemSchema = z.object({
  content: z.string().max(LIMITS.listItemContentMaxChars),
  trailing: z.string().max(LIMITS.listItemTrailingMaxChars).optional(),
});

const listElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.list),
  style: z.enum(LIST_STYLE_VALUES).default(DEFAULT_LIST_STYLE),
  items: z
    .array(listItemSchema)
    .min(LIMITS.minListItems)
    .max(LIMITS.maxListItems),
});

const gridCellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  /** Hex background (#RRGGBB); omit for transparent */
  color: z
    .string()
    .regex(HEX_COLOR_6_RE, {
      message: "cell color must be a valid 6-digit hex color (#RRGGBB)",
    })
    .optional(),
  content: z.string().optional(),
});

const gridElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.grid),
    cols: z.number().int().min(LIMITS.minGridCols).max(LIMITS.maxGridCols),
    rows: z.number().int().min(LIMITS.minGridRows).max(LIMITS.maxGridRows),
    cells: z.array(gridCellSchema),
    cellSize: z.enum(GRID_CELL_SIZE_VALUES).optional(),
    gap: z.enum(GRID_GAP_VALUES).default(DEFAULT_GRID_GAP),
    interactive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    const { cols, rows, cells } = val;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]!;
      const base = ["cells", i] as const;
      if (c.row < 0 || c.row >= rows) {
        ctx.addIssue({
          code: "custom",
          message: `grid cell row ${c.row} is out of bounds (expected 0 to ${
            rows - 1
          })`,
          path: [...base, "row"],
        });
      }
      if (c.col < 0 || c.col >= cols) {
        ctx.addIssue({
          code: "custom",
          message: `grid cell col ${c.col} is out of bounds (expected 0 to ${
            cols - 1
          })`,
          path: [...base, "col"],
        });
      }
    }
  });

const textInputElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.text_input),
  name: z.string().min(1),
  placeholder: z.string().max(60).optional(),
  maxLength: z.number().int().min(1).max(LIMITS.maxTextInputChars).optional(),
});

const sliderElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.slider),
    name: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().default(DEFAULT_SLIDER_STEP),
    value: z.number().optional(),
    label: z.string().max(60).optional(),
    minLabel: z.string().max(20).optional(),
    maxLabel: z.string().max(20).optional(),
  })
  .superRefine((val, ctx) => {
    const { min, max, step, value } = val;
    if (min > max) {
      ctx.addIssue({
        code: "custom",
        message: `slider min (${min}) must be less than or equal to max (${max})`,
        path: ["min"],
      });
      return;
    }
    if (step !== undefined) {
      if (step <= 0 || !Number.isFinite(step)) {
        ctx.addIssue({
          code: "custom",
          message: "slider step must be a finite number greater than 0",
          path: ["step"],
        });
        return;
      }
    }
    if (value !== undefined) {
      if (!Number.isFinite(value)) {
        ctx.addIssue({
          code: "custom",
          message: "slider value must be a finite number",
          path: ["value"],
        });
        return;
      }
      if (value < min || value > max) {
        ctx.addIssue({
          code: "custom",
          message: `slider value (${value}) must be between min (${min}) and max (${max})`,
          path: ["value"],
        });
        return;
      }
      if (step !== undefined && max > min) {
        const delta = value - min;
        const steps = delta / step;
        const rounded = Math.round(steps);
        if (Math.abs(steps - rounded) > SLIDER_STEP_ALIGN_EPS) {
          ctx.addIssue({
            code: "custom",
            message: `slider value (${value}) is not reachable from min (${min}) with step (${step})`,
            path: ["value"],
          });
        }
      }
    }
  })
  .transform((val) => ({
    ...val,
    value: val.value ?? (val.min + val.max) / 2,
  }));

const buttonGroupElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.button_group),
    name: z.string().min(1),
    options: z
      .array(z.string().max(LIMITS.maxButtonGroupOptionChars))
      .min(LIMITS.minButtonGroupOptions)
      .max(LIMITS.maxButtonGroupOptions),
    style: z.enum(BUTTON_GROUP_STYLE_VALUES).optional(),
  })
  .transform((val) => ({
    ...val,
    style:
      val.style ??
      (val.options.length <= 3
        ? BUTTON_GROUP_STYLE.row
        : BUTTON_GROUP_STYLE.stack),
  }));

const toggleElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.toggle),
  name: z.string().min(1),
  label: z.string().max(60),
  value: z.boolean().default(false),
});

const barChartBarSchema = z.object({
  label: z.string().max(LIMITS.barChartLabelMaxChars),
  value: z.number().nonnegative(),
  color: z.enum(PALETTE_COLOR_VALUES).optional(),
});

const barChartElementSchema = z
  .object({
    type: z.literal(ELEMENT_TYPE.bar_chart),
    bars: z.array(barChartBarSchema).min(1).max(LIMITS.maxBarChartBars),
    max: z.number().nonnegative().optional(),
    color: z.enum(BAR_CHART_COLOR_VALUES).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.max !== undefined) {
      for (let i = 0; i < val.bars.length; i++) {
        const bar = val.bars[i]!;
        if (bar.value > val.max) {
          ctx.addIssue({
            code: "custom",
            message: `bar value (${bar.value}) exceeds chart max (${val.max})`,
            path: ["bars", i, "value"],
          });
        }
      }
    }
  });

const buttonActionSchema = z.enum(BUTTON_ACTION_VALUES);

const buttonStyleSchema = z.enum(BUTTON_STYLE_VALUES);

/* ------------------------------------------------------------------ */
/*  Button schema                                                      */
/* ------------------------------------------------------------------ */

export const buttonSchema = z
  .object({
    label: z.string().min(1).max(LIMITS.maxButtonLabelChars),
    action: buttonActionSchema,
    /** URL target for post/link/mini_app buttons */
    target: z.string().min(1).optional(),
    /** Structured client action for client buttons */
    client_action: clientActionSchema.optional(),
    style: buttonStyleSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === BUTTON_ACTION.client) {
      // client buttons require client_action, must not have target
      if (val.client_action === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `button with action "client" must include a "client_action" object`,
          path: ["client_action"],
        });
      }
      if (val.target !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `button with action "client" must not include "target"`,
          path: ["target"],
        });
      }
    } else {
      // post/link/mini_app buttons require target, must not have client_action
      if (val.target === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `button with action "${val.action}" must include a "target" URL`,
          path: ["target"],
        });
      }
      if (val.client_action !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `button with action "${val.action}" must not include "client_action"`,
          path: ["client_action"],
        });
      }
      if (
        val.target &&
        (val.action === BUTTON_ACTION.post ||
          val.action === BUTTON_ACTION.link ||
          val.action === BUTTON_ACTION.mini_app) &&
        !isSecureOrLoopbackHttpButtonTarget(val.target)
      ) {
        ctx.addIssue({
          code: "custom",
          message: `button target must use HTTPS (or http:// on localhost / 127.0.0.1 for development) for action "${val.action}" (received: ${val.target})`,
          path: ["target"],
        });
      }
    }
  });

export type Button = z.infer<typeof buttonSchema>;

/** Child elements allowed inside `group` (no media, no nested group) */
const groupChildElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  dividerElementSchema,
  spacerElementSchema,
  progressElementSchema,
  listElementSchema,
  textInputElementSchema,
  sliderElementSchema,
  buttonGroupElementSchema,
  toggleElementSchema,
  barChartElementSchema,
]);

export type GroupChildElement = z.infer<typeof groupChildElementSchema>;

const groupElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.group),
  layout: z.enum(GROUP_LAYOUT_VALUES),
  children: z
    .array(groupChildElementSchema)
    .min(LIMITS.minGroupChildren)
    .max(LIMITS.maxGroupChildren),
});

/** Any single page element, including media and `group` */
const elementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  dividerElementSchema,
  spacerElementSchema,
  progressElementSchema,
  listElementSchema,
  gridElementSchema,
  textInputElementSchema,
  sliderElementSchema,
  buttonGroupElementSchema,
  toggleElementSchema,
  groupElementSchema,
  barChartElementSchema,
]);

export type Element = z.infer<typeof elementSchema>;

export type SnapPageElementInput = z.input<typeof elementSchema>;

export const elementsSchema = z
  .object({
    type: z.literal(PAGE_ROOT_TYPE.stack),
    children: z
      .array(elementSchema)
      .min(1, { message: "stack must have at least 1 child element" })
      .max(LIMITS.maxElementsPerPage, {
        message: `cannot have more than ${LIMITS.maxElementsPerPage} elements`,
      }),
  })
  .strict();

export type Elements = z.infer<typeof elementsSchema>;
