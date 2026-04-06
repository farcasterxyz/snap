import { z } from "zod";
import { ICON_NAMES } from "./icon.js";

export const BUTTON_VARIANTS = ["secondary", "primary"] as const;
export const BUTTON_MAX_LABEL_CHARS = 30;

export const buttonProps = z.object({
  label: z.string().min(1).max(BUTTON_MAX_LABEL_CHARS),
  variant: z.enum(BUTTON_VARIANTS).optional(),
  icon: z.enum(ICON_NAMES).optional(),
});

export type ButtonProps = z.infer<typeof buttonProps>;
