import { z } from "zod";
import { LIMITS } from "../constants.js";
import { BAR_CHART_COLOR_VALUES, PALETTE_COLOR_VALUES } from "../colors.js";

export const barChartProps = z.object({
  bars: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().nonnegative(),
        color: z.enum(PALETTE_COLOR_VALUES).optional(),
      }),
    )
    .min(1)
    .max(LIMITS.maxBarChartBars),
  max: z.number().nonnegative().optional(),
  color: z.enum(BAR_CHART_COLOR_VALUES).optional(),
});

export type BarChartProps = z.infer<typeof barChartProps>;
