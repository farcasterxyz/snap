import { z } from "zod";

export const toggleProps = z.object({
  name: z.string().min(1),
  label: z.string(),
  value: z.boolean().default(false),
});

export type ToggleProps = z.infer<typeof toggleProps>;
