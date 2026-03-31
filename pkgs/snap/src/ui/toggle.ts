import { z } from "zod/v4";

export const toggleProps = z.object({
  name: z.string().min(1),
  label: z.string(),
  value: z.boolean().optional(),
});

export type ToggleProps = z.infer<typeof toggleProps>;
