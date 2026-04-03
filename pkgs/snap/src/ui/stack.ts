import { z } from "zod";

export const STACK_DIRECTIONS = ["vertical", "horizontal"] as const;
export const STACK_GAPS = ["none", "sm", "md", "lg"] as const;

export const stackProps = z.object({
  direction: z.enum(STACK_DIRECTIONS).optional(),
  gap: z.enum(STACK_GAPS).optional(),
});

export type StackProps = z.infer<typeof stackProps>;
