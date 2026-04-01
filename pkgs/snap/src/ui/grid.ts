import { z } from "zod";
import {
  GRID_CELL_SIZE_VALUES,
  GRID_GAP_VALUES,
  HEX_COLOR_6_RE,
  LIMITS,
} from "../constants.js";

const gridCellZ = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  color: z.string().regex(HEX_COLOR_6_RE).optional(),
  content: z.string().optional(),
});

export const gridProps = z.object({
  cols: z.number().int().min(LIMITS.minGridCols).max(LIMITS.maxGridCols),
  rows: z.number().int().min(LIMITS.minGridRows).max(LIMITS.maxGridRows),
  cells: z.array(gridCellZ),
  cellSize: z.enum(GRID_CELL_SIZE_VALUES).optional(),
  gap: z.enum(GRID_GAP_VALUES).optional(),
  interactive: z.boolean().optional(),
});

export type GridProps = z.infer<typeof gridProps>;
