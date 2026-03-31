import { z } from "zod/v4";

export const spacerProps = z.object({
  size: z.enum(["small", "medium", "large"]).optional(),
});

export type SpacerProps = z.infer<typeof spacerProps>;
