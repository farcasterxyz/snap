import { z } from "zod";
import { LIMITS, LIST_STYLE_VALUES } from "../constants.js";

const listItemZ = z.object({
  content: z.string(),
  trailing: z.string().optional(),
});

export const listProps = z.object({
  style: z.enum(LIST_STYLE_VALUES).optional(),
  items: z
    .array(listItemZ)
    .min(LIMITS.minListItems)
    .max(LIMITS.maxListItems),
});

export type ListProps = z.infer<typeof listProps>;
