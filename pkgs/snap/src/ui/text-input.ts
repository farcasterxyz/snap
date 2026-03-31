import { z } from "zod";

export const textInputProps = z.object({
  name: z.string().min(1),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().max(280).optional(),
});

export type TextInputProps = z.infer<typeof textInputProps>;
