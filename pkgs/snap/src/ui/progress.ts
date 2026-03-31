import { z } from "zod/v4";
import { PROGRESS_COLOR_VALUES } from "../constants.js";

export const progressProps = z.object({
  value: z.number(),
  max: z.number(),
  label: z.string().optional(),
  color: z.enum(PROGRESS_COLOR_VALUES).optional(),
});

export type ProgressProps = z.infer<typeof progressProps>;
