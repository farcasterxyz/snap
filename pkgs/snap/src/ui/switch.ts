import { z } from "zod";

export const SWITCH_MAX_LABEL_CHARS = 60;

export const switchProps = z.object({
  name: z.string().min(1),
  label: z.string().max(SWITCH_MAX_LABEL_CHARS).optional(),
  defaultChecked: z.boolean().optional(),
});

export type SwitchProps = z.infer<typeof switchProps>;
