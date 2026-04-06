import { z } from "zod";
import { PROGRESS_COLOR_VALUES } from "../colors.js";
import { ICON_NAMES } from "./icon.js";

export const BADGE_VARIANTS = ["default", "outline"] as const;
export const BADGE_MAX_LABEL_CHARS = 30;

export const badgeProps = z.object({
  label: z.string().min(1).max(BADGE_MAX_LABEL_CHARS),
  variant: z.enum(BADGE_VARIANTS).optional(),
  color: z.enum(PROGRESS_COLOR_VALUES).optional(),
  icon: z.enum(ICON_NAMES).optional(),
});

export type BadgeProps = z.infer<typeof badgeProps>;
