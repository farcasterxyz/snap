import { z } from "zod/v4";

export const progressProps = z.object({
  value: z.number(),
  max: z.number(),
  label: z.string().optional(),
  color: z.enum(["accent", "green", "red", "orange", "gray"]).optional(),
});

export type ProgressProps = z.infer<typeof progressProps>;
