import { z } from "zod";

export const PROGRESS_MAX_LABEL_CHARS = 60;

export const progressProps = z
  .object({
    value: z.number(),
    max: z.number(),
    label: z.string().max(PROGRESS_MAX_LABEL_CHARS).optional(),
  })
  .superRefine((val, ctx) => {
    if (!Number.isFinite(val.max) || val.max <= 0) {
      ctx.addIssue({
        code: "custom",
        message: `progress max must be a finite number > 0 (got ${val.max})`,
        path: ["max"],
      });
      return;
    }
    if (!Number.isFinite(val.value) || val.value < 0 || val.value > val.max) {
      ctx.addIssue({
        code: "custom",
        message: `progress value (${val.value}) must be between 0 and max (${val.max})`,
        path: ["value"],
      });
    }
  });

export type ProgressProps = z.infer<typeof progressProps>;
