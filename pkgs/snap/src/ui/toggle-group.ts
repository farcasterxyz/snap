import { z } from "zod";

export const TOGGLE_GROUP_VARIANTS = ["default", "outline"] as const;
export const TOGGLE_GROUP_ORIENTATIONS = ["horizontal", "vertical"] as const;
export const TOGGLE_GROUP_MIN_OPTIONS = 2;
export const TOGGLE_GROUP_MAX_OPTIONS = 6;
export const TOGGLE_GROUP_MAX_OPTION_CHARS = 30;
export const TOGGLE_GROUP_MAX_LABEL_CHARS = 60;

export const toggleGroupProps = z.object({
  name: z.string().min(1),
  label: z.string().max(TOGGLE_GROUP_MAX_LABEL_CHARS).optional(),
  multiple: z.boolean().optional(),
  orientation: z.enum(TOGGLE_GROUP_ORIENTATIONS).optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
  options: z
    .array(z.string().min(1).max(TOGGLE_GROUP_MAX_OPTION_CHARS))
    .min(TOGGLE_GROUP_MIN_OPTIONS)
    .max(TOGGLE_GROUP_MAX_OPTIONS),
  variant: z.enum(TOGGLE_GROUP_VARIANTS).optional(),
});

export type ToggleGroupProps = z.infer<typeof toggleGroupProps>;
