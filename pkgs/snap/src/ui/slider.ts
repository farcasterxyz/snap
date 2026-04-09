import { z } from "zod";

export const SLIDER_MAX_LABEL_CHARS = 60;
export const SLIDER_DEFAULT_STEP = 1;
export const SLIDER_STEP_ALIGN_EPS = 1e-6;

export const sliderProps = z
  .object({
    name: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    defaultValue: z.number().optional(),
    label: z.string().max(SLIDER_MAX_LABEL_CHARS).optional(),
    /** When true, display the current value next to the label. */
    showValue: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.min > val.max) {
      ctx.addIssue({
        code: "custom",
        message: `slider min (${val.min}) must be <= max (${val.max})`,
        path: ["min"],
      });
      return;
    }
    if (val.step !== undefined && (val.step <= 0 || !Number.isFinite(val.step))) {
      ctx.addIssue({
        code: "custom",
        message: "slider step must be a finite number > 0",
        path: ["step"],
      });
      return;
    }
    if (val.defaultValue !== undefined) {
      if (val.defaultValue < val.min || val.defaultValue > val.max) {
        ctx.addIssue({
          code: "custom",
          message: `slider defaultValue (${val.defaultValue}) must be between min (${val.min}) and max (${val.max})`,
          path: ["defaultValue"],
        });
      }
    }
  });

export type SliderProps = z.infer<typeof sliderProps>;
