import { z } from "zod";

export const groupProps = z.object({
  layout: z.literal("row"),
});

export type GroupProps = z.infer<typeof groupProps>;
