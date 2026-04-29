import { z } from "zod";

export const STACK_DIRECTIONS = ["vertical", "horizontal"] as const;
export const STACK_GAPS = ["none", "sm", "md", "lg"] as const;
export const STACK_JUSTIFY = ["start", "center", "end", "between", "around"] as const;

export const stackProps = z.object({
  direction: z.enum(STACK_DIRECTIONS).optional(),
  gap: z.enum(STACK_GAPS).optional(),
  justify: z.enum(STACK_JUSTIFY).optional(),
  /** Horizontal stacks only: fixed column grid (`2`–`6`). Prefer omitting this when children are stacks — they flex as row peers automatically. */
  columns: z.union([
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]).optional(),
});

export type StackProps = z.infer<typeof stackProps>;
