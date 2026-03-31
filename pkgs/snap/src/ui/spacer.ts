import { z } from "zod";

export const spacerProps = z.object({
  size: z.enum(["small", "medium", "large"]).optional(),
});

export type SpacerProps = z.infer<typeof spacerProps>;
