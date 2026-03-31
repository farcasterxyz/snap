import { z } from "zod";

export const buttonGroupProps = z.object({
  name: z.string().min(1),
  options: z.array(z.string()).min(2).max(4),
  style: z.enum(["row", "stack", "grid"]).optional(),
});

export type ButtonGroupProps = z.infer<typeof buttonGroupProps>;
