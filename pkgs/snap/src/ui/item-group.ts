import { z } from "zod";

import { STACK_GAPS } from "./stack.js";

export const itemGroupProps = z.object({
  border: z.boolean().optional(),
  separator: z.boolean().optional(),
  gap: z.enum(STACK_GAPS).optional(),
});

export type ItemGroupProps = z.infer<typeof itemGroupProps>;
