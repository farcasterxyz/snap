import { z } from "zod";

const gridCellZ = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  content: z.string().optional(),
});

export const gridProps = z.object({
  cols: z.number().int().min(2).max(64),
  rows: z.number().int().min(2).max(8),
  cells: z.array(gridCellZ),
  cellSize: z.enum(["auto", "square"]).optional(),
  gap: z.enum(["none", "small", "medium"]).optional(),
  interactive: z.boolean().optional(),
});

export type GridProps = z.infer<typeof gridProps>;
