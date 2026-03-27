/**
 * Zod prop shapes for each catalog component — mirrors spec/validator element fields
 * (length limits relaxed here; `@farcaster/snap` still gates authored snap JSON).
 */
import { z } from "zod";

const textStyleZ = z.enum(["title", "body", "caption", "label"]);
const textAlignZ = z.enum(["left", "center", "right"]).optional();
const imageAspectZ = z.enum(["1:1", "16:9", "4:3", "3:4", "9:16"]);
const videoAspectZ = z.enum(["1:1", "16:9", "9:16"]);
const spacerSizeZ = z.enum(["small", "medium", "large"]).optional();
const progressColorZ = z
  .enum(["accent", "green", "red", "orange", "gray"])
  .optional();
const listStyleZ = z.enum(["ordered", "unordered", "plain"]).optional();
const gridCellSizeZ = z.enum(["auto", "square"]).optional();
const gridGapZ = z.enum(["none", "small", "medium"]).optional();
const buttonGroupStyleZ = z.enum(["row", "stack", "grid"]).optional();
const snapButtonActionZ = z.enum(["post", "link", "mini_app", "sdk"]);
const snapButtonStyleZ = z.enum(["primary", "secondary"]).optional();

const listItemZ = z.object({
  content: z.string(),
  trailing: z.string().optional(),
});

const gridCellZ = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  content: z.string().optional(),
});

export const snapComponentProps = {
  Text: z.object({
    style: textStyleZ,
    content: z.string(),
    align: textAlignZ,
  }),
  Image: z.object({
    url: z.string(),
    aspect: imageAspectZ,
    alt: z.string().optional(),
  }),
  Video: z.object({
    url: z.string(),
    aspect: videoAspectZ,
    alt: z.string().optional(),
  }),
  Divider: z.object({}),
  Spacer: z.object({
    size: spacerSizeZ,
  }),
  Progress: z.object({
    value: z.number(),
    max: z.number(),
    label: z.string().optional(),
    color: progressColorZ,
  }),
  List: z.object({
    style: listStyleZ,
    items: z.array(listItemZ).min(1).max(4),
  }),
  Grid: z.object({
    cols: z.number().int().min(2).max(64),
    rows: z.number().int().min(2).max(8),
    cells: z.array(gridCellZ),
    cellSize: gridCellSizeZ,
    gap: gridGapZ,
    interactive: z.boolean().optional(),
  }),
  TextInput: z.object({
    name: z.string().min(1),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().max(280).optional(),
  }),
  Slider: z.object({
    name: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    value: z.number().optional(),
    label: z.string().optional(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
  }),
  ButtonGroup: z.object({
    name: z.string().min(1),
    options: z.array(z.string()).min(2).max(4),
    style: buttonGroupStyleZ,
  }),
  Toggle: z.object({
    name: z.string().min(1),
    label: z.string(),
    value: z.boolean().optional(),
  }),
  BarChart: z.object({
    bars: z
      .array(
        z.object({
          label: z.string(),
          value: z.number().nonnegative(),
          color: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional(),
        }),
      )
      .min(1)
      .max(6),
    max: z.number().nonnegative().optional(),
    color: z
      .enum(["accent", "green", "red", "orange", "blue", "gray"])
      .optional(),
  }),
  /** Horizontal row of other elements; children are element ids in the flat spec map. */
  Group: z.object({
    layout: z.literal("row"),
  }),
  /**
   * Vertical stack of snap body elements (maps from snap `page.elements`).
   * Children are element ids in the flat spec map.
   */
  Stack: z.object({}),
  /**
   * Bottom snap button (SPEC.md § Buttons). Bind `on.press` to a catalog action
   * when generating interactive json-render output.
   */
  ActionButton: z.object({
    label: z.string(),
    action: snapButtonActionZ,
    target: z.string(),
    style: snapButtonStyleZ,
  }),
} as const;
