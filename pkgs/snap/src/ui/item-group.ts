import { z } from "zod";

export const itemGroupProps = z.object({
  border: z.boolean().optional(),
  separator: z.boolean().optional(),
});

export type ItemGroupProps = z.infer<typeof itemGroupProps>;
