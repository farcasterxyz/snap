import { z } from "zod";

export const STACK_DIRECTIONS = ["vertical", "horizontal"] as const;
export const STACK_GAPS = ["none", "sm", "md", "lg"] as const;
export const STACK_JUSTIFY = ["start", "center", "end", "between", "around"] as const;

export const stackProps = z.object({
  direction: z.enum(STACK_DIRECTIONS).optional(),
  gap: z.enum(STACK_GAPS).optional(),
  justify: z.enum(STACK_JUSTIFY).optional(),
  /** Horizontal stacks only: make direct children equal width. */
  equalWidth: z.boolean().optional(),
  /** Horizontal stacks only: legacy fixed equal-width column count (`2`–`6`). Prefer `equalWidth`. */
  columns: z.union([
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]).optional(),
});

export type StackProps = z.infer<typeof stackProps>;
