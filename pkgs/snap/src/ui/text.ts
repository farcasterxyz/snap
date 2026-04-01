import { z } from "zod";
import { TEXT_ALIGN_VALUES, TEXT_STYLE_VALUES } from "../constants.js";

export const textProps = z.object({
  style: z.enum(TEXT_STYLE_VALUES),
  content: z.string(),
  align: z.enum(TEXT_ALIGN_VALUES).optional(),
});

export type TextProps = z.infer<typeof textProps>;
