import { z } from "zod";
import {
  BAR_CHART_COLOR_VALUES,
  BUTTON_ACTION,
  BUTTON_ACTION_VALUES,
  BUTTON_GROUP_STYLE,
  BUTTON_GROUP_STYLE_VALUES,
  BUTTON_LAYOUT_VALUES,
  BUTTON_STYLE_VALUES,
  DEFAULT_BUTTON_LAYOUT,
  DEFAULT_LIST_STYLE,
  DEFAULT_SLIDER_STEP,
  DEFAULT_THEME_ACCENT,
  EFFECT_VALUES,
  ELEMENT_TYPE,
  GRID_CELL_SIZE_VALUES,
  GRID_GAP_VALUES,
  GROUP_LAYOUT_VALUES,
  HEX_COLOR_6_RE,
  HTTP_PREFIX,
  HTTPS_PREFIX,
  IMAGE_ASPECT_VALUES,
  INTERACTIVE_ELEMENT_TYPES,
  LIMITS,
  LIST_STYLE_VALUES,
  MEDIA_ELEMENT_TYPES,
  PAGE_ROOT_TYPE,
  PALETTE_COLOR_VALUES,
  PROGRESS_COLOR_VALUES,
  SLIDER_STEP_ALIGN_EPS,
  SPACER_SIZE,
  SPACER_SIZE_VALUES,
  SPEC_VERSION,
  TEXT_ALIGN_VALUES,
  TEXT_CONTENT_MAX,
  TEXT_STYLE,
  TEXT_STYLE_VALUES,
  VIDEO_ASPECT_VALUES,
} from "./constants";

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

const themeAccentSchema = z.enum(PALETTE_COLOR_VALUES, {
  message: `accent must be a palette color: ${PALETTE_COLOR_VALUES.join(", ")}`,
});

const themeSchema = z
  .object({
    accent: themeAccentSchema.default(DEFAULT_THEME_ACCENT),
  })
  .strict();

const httpsUrl = z.string().refine((s) => s.startsWith(HTTPS_PREFIX), {
  message: "URL must use HTTPS",
});

function hasAllowedMediaExtension(
  urlString: string,
  allowedExtensions: string[],
): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:") return false;
    const lowerPathname = url.pathname.toLowerCase();
    return allowedExtensions.some((extension) =>
      lowerPathname.endsWith(`.${extension}`),
    );
  } catch {
    return false;
  }
}

const imageUrlSchema = z
  .string()
  .refine((s) => hasAllowedMediaExtension(s, ["jpg", "png", "gif", "webp"]), {
    message:
      "image URL must use HTTPS and end with a supported extension (.jpg, .png, .gif, .webp)",
  });

const videoUrlSchema = z
  .string()
  .refine((s) => hasAllowedMediaExtension(s, ["mp4", "webm"]), {
    message:
      "video URL must use HTTPS and end with a supported extension (.mp4, .webm)",
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

const videoElementSchema = z.object({
  type: z.literal(ELEMENT_TYPE.video),
  url: videoUrlSchema,
  aspect: z.enum(VIDEO_ASPECT_VALUES),
  maxDuration: z.number().max(LIMITS.maxVideoDurationSeconds).optional(),
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
    gap: z.enum(GRID_GAP_VALUES).optional(),
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

const buttonSchema = z
  .object({
    label: z.string().min(1).max(LIMITS.maxButtonLabelChars),
    action: buttonActionSchema,
    /** URL (HTTPS for post/link/mini_app) or SDK action id (e.g. cast:view:...) */
    target: z.string().min(1),
    style: buttonStyleSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (
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
  });

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
  videoElementSchema,
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

const elementsSchema = z
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

export type Button = z.infer<typeof buttonSchema>;
export type Element = z.infer<typeof elementSchema>;
export type Elements = z.infer<typeof elementsSchema>;

export const rootSchema = z
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
            message: `cannot have more than 1 media element (image, video, or grid)`,
            path: ["elements", "children"],
          });
        }
      }),
  })
  .strict();

// extra constraints for the first page to make it look nicer
export const firstPageRootSchema = rootSchema.superRefine((root, ctx) => {
  const body = root.page.elements.children;

  const hasTextTitleOrBody = body.some(
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

  const hasInteractive = body.some((el) =>
    INTERACTIVE_ELEMENT_TYPES.includes(el.type),
  );
  const hasMedia = body.some((el) => MEDIA_ELEMENT_TYPES.includes(el.type));
  if (!hasInteractive && !hasMedia) {
    ctx.addIssue({
      code: "custom",
      message:
        "first page must have at least one interactive element (button_group, slider, text_input, toggle) or media element (image, video, grid)",
      path: ["page", "elements", "children"],
    });
  }
});

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

export type SnapResponse = z.infer<typeof rootSchema>;
export type SnapPage = SnapResponse["page"];
export type SnapPayload = z.infer<typeof payloadSchema>;

const snapPostActionSchema = payloadSchema
  .omit({ button_index: true })
  .extend({
    type: z.literal("post"),
    buttonIndex: payloadSchema.shape.button_index,
  })
  .strict();

export type SnapPostAction = z.infer<typeof snapPostActionSchema>;

export type SnapAction =
  | {
      type: "get";
    }
  | SnapPostAction;

export type SnapContext = {
  action: SnapAction;
  request: Request;
};

export type SnapFunction = (ctx: SnapContext) => Promise<SnapResponse>;
