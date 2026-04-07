import { z } from "zod";
import { BAR_CHART_COLOR_VALUES, PALETTE_COLOR_VALUES } from "../colors.js";
import {
  BAR_CHART_MAX_BARS,
  BAR_CHART_LABEL_MAX_CHARS,
} from "../constants.js";

export const barChartProps = z
  .object({
    bars: z
      .array(
        z.object({
          label: z.string().min(1).max(BAR_CHART_LABEL_MAX_CHARS),
          value: z.number().nonnegative(),
          color: z.enum(PALETTE_COLOR_VALUES).optional(),
        }),
      )
      .min(1)
      .max(BAR_CHART_MAX_BARS),
    max: z.number().nonnegative().optional(),
    color: z.enum(BAR_CHART_COLOR_VALUES).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.max !== undefined) {
      for (let i = 0; i < val.bars.length; i++) {
        const bar = val.bars[i]!;
        if (bar.value > val.max) {
          ctx.addIssue({
            code: "custom",
            message: `bar value (${bar.value}) exceeds chart max (${val.max})`,
            path: ["bars", i, "value"],
          });
        }
      }
    }
  });

export type BarChartProps = z.infer<typeof barChartProps>;
