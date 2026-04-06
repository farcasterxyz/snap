import { z } from "zod";

export const ITEM_VARIANTS = ["default"] as const;
export const ITEM_MAX_TITLE_CHARS = 100;
export const ITEM_MAX_DESCRIPTION_CHARS = 160;

export const itemProps = z.object({
  title: z.string().min(1).max(ITEM_MAX_TITLE_CHARS),
  description: z.string().max(ITEM_MAX_DESCRIPTION_CHARS).optional(),
  variant: z.enum(ITEM_VARIANTS).optional(),
});

export type ItemProps = z.infer<typeof itemProps>;
