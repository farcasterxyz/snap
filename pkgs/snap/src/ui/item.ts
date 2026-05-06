import { z } from "zod";
import { PROGRESS_COLOR_VALUES } from "../colors.js";
import { ICON_NAMES } from "./icon.js";

export const ITEM_VARIANTS = ["default"] as const;
export const ITEM_MEDIA_VARIANTS = ["icon", "image"] as const;
export const ITEM_MAX_TITLE_CHARS = 100;
export const ITEM_MAX_DESCRIPTION_CHARS = 160;
export const ITEM_MAX_MEDIA_ALT_CHARS = 120;

const itemIconMediaProps = z
  .object({
    variant: z.literal("icon"),
    name: z.enum(ICON_NAMES),
    color: z.enum(PROGRESS_COLOR_VALUES).optional(),
  })
  .strict();

const itemImageMediaProps = z
  .object({
    variant: z.literal("image"),
    url: z.string(),
    alt: z.string().max(ITEM_MAX_MEDIA_ALT_CHARS).optional(),
  })
  .strict();

export const itemMediaProps = z.discriminatedUnion("variant", [
  itemIconMediaProps,
  itemImageMediaProps,
]);

export const itemProps = z
  .object({
    title: z.string().min(1).max(ITEM_MAX_TITLE_CHARS),
    description: z.string().max(ITEM_MAX_DESCRIPTION_CHARS).optional(),
    variant: z.enum(ITEM_VARIANTS).optional(),
    media: itemMediaProps.optional(),
  })
  .strict();

export type ItemProps = z.infer<typeof itemProps>;
export type ItemMediaProps = z.infer<typeof itemMediaProps>;
