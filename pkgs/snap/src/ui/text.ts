import { z } from "zod/v4";

export const textProps = z.object({
  style: z.enum(["title", "body", "caption", "label"]),
  content: z.string(),
  align: z.enum(["left", "center", "right"]).optional(),
});

export type TextProps = z.infer<typeof textProps>;
