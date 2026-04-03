import { z } from "zod";

export const INPUT_TYPES = ["text", "number"] as const;
export const INPUT_MAX_CHARS = 280;
export const INPUT_MAX_LABEL_CHARS = 60;
export const INPUT_MAX_PLACEHOLDER_CHARS = 60;

export const inputProps = z.object({
  name: z.string().min(1),
  type: z.enum(INPUT_TYPES).optional(),
  label: z.string().max(INPUT_MAX_LABEL_CHARS).optional(),
  placeholder: z.string().max(INPUT_MAX_PLACEHOLDER_CHARS).optional(),
  defaultValue: z.string().optional(),
  maxLength: z.number().int().min(1).max(INPUT_MAX_CHARS).optional(),
});

export type InputProps = z.infer<typeof inputProps>;
