import { z } from "zod";
import {
  BUTTON_GROUP_STYLE,
  BUTTON_GROUP_STYLE_VALUES,
  LIMITS,
} from "../constants.js";

export const buttonGroupProps = z
  .object({
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

export type ButtonGroupProps = z.infer<typeof buttonGroupProps>;
