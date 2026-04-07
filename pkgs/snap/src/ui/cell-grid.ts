import { z } from "zod";
import { PALETTE_COLOR_VALUES } from "../colors.js";
import {
  GRID_MIN_COLS,
  GRID_MAX_COLS,
  GRID_MIN_ROWS,
  GRID_MAX_ROWS,
  GRID_GAP_VALUES,
} from "../constants.js";

const cellGridCellSchema = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  color: z.enum(PALETTE_COLOR_VALUES).optional(),
  content: z.string().optional(),
});

export const cellGridProps = z
  .object({
    name: z.string().min(1).optional(),
    cols: z.number().int().min(GRID_MIN_COLS).max(GRID_MAX_COLS),
    rows: z.number().int().min(GRID_MIN_ROWS).max(GRID_MAX_ROWS),
    cells: z.array(cellGridCellSchema),
    gap: z.enum(GRID_GAP_VALUES).optional(),
    rowHeight: z.number().int().min(8).max(64).optional(),
    select: z.enum(["off", "single", "multiple"]).optional(),
  })
  .superRefine((val, ctx) => {
    const { cols, rows, cells } = val;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]!;
      if (c.row < 0 || c.row >= rows) {
        ctx.addIssue({
          code: "custom",
          message: `cell_grid cell row ${c.row} out of bounds (0–${rows - 1})`,
          path: ["cells", i, "row"],
        });
      }
      if (c.col < 0 || c.col >= cols) {
        ctx.addIssue({
          code: "custom",
          message: `cell_grid cell col ${c.col} out of bounds (0–${cols - 1})`,
          path: ["cells", i, "col"],
        });
      }
    }
  });

export type CellGridProps = z.infer<typeof cellGridProps>;
