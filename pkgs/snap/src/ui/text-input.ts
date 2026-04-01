import { z } from "zod";
import { LIMITS } from "../constants.js";

export const textInputProps = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  maxLength: z
    .number()
    .int()
    .positive()
    .max(LIMITS.maxTextInputChars)
    .optional(),
});

export type TextInputProps = z.infer<typeof textInputProps>;
