import { z } from "zod";
import { PROGRESS_COLOR_VALUES } from "../colors.js";

export const ICON_NAMES = [
  // Navigation/Actions
  "arrow-right",
  "arrow-left",
  "external-link",
  "chevron-right",
  // Status
  "check",
  "x",
  "alert-triangle",
  "info",
  "clock",
  // Social
  "heart",
  "message-circle",
  "repeat",
  "share",
  "user",
  "users",
  // Content
  "star",
  "trophy",
  "zap",
  "flame",
  "gift",
  // Media
  "image",
  "play",
  "pause",
  // Commerce
  "wallet",
  "coins",
  // Common actions
  "plus",
  "minus",
  "refresh-cw",
  "bookmark",
  // Feedback/data
  "thumbs-up",
  "thumbs-down",
  "trending-up",
  "trending-down",
] as const;

export const ICON_SIZES = ["sm", "md"] as const;

export const iconProps = z.object({
  name: z.enum(ICON_NAMES),
  color: z.enum(PROGRESS_COLOR_VALUES).optional(),
  size: z.enum(ICON_SIZES).optional(),
});

export type IconProps = z.infer<typeof iconProps>;
