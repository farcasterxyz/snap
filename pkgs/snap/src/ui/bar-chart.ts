import { z } from "zod";

export const barChartProps = z.object({
  bars: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().nonnegative(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      }),
    )
    .min(1)
    .max(6),
  max: z.number().nonnegative().optional(),
  color: z
    .enum(["accent", "green", "red", "orange", "blue", "gray"])
    .optional(),
});

export type BarChartProps = z.infer<typeof barChartProps>;
