import { z } from "zod";

export const groupProps = z.object({
  layout: z.enum(["row", "grid"]),
});

export type GroupProps = z.infer<typeof groupProps>;
