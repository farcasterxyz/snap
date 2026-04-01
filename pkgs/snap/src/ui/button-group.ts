import { z } from "zod";
import { BUTTON_GROUP_STYLE_VALUES, LIMITS } from "../constants.js";

export const buttonGroupProps = z.object({
  name: z.string().min(1),
  options: z
    .array(z.string())
    .min(LIMITS.minButtonGroupOptions)
    .max(LIMITS.maxButtonGroupOptions),
  style: z.enum(BUTTON_GROUP_STYLE_VALUES).optional(),
});

export type ButtonGroupProps = z.infer<typeof buttonGroupProps>;
