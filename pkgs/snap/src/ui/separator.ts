import { z } from "zod";

export const SEPARATOR_ORIENTATIONS = ["horizontal", "vertical"] as const;

export const separatorProps = z.object({
  orientation: z.enum(SEPARATOR_ORIENTATIONS).optional(),
});

export type SeparatorProps = z.infer<typeof separatorProps>;
