import { z } from "zod";

export const sliderProps = z.object({
  name: z.string().min(1),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  value: z.number().optional(),
  label: z.string().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
});

export type SliderProps = z.infer<typeof sliderProps>;
