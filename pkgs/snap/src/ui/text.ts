import { z } from "zod";

export const TEXT_SIZES = ["md", "sm"] as const;
export const TEXT_WEIGHTS = ["bold", "normal"] as const;
export const TEXT_ALIGNS = ["left", "center", "right"] as const;
export const TEXT_MAX_CONTENT_CHARS = 320;

export const textProps = z.object({
  content: z.string().min(1).max(TEXT_MAX_CONTENT_CHARS),
  size: z.enum(TEXT_SIZES).optional(),
  weight: z.enum(TEXT_WEIGHTS).optional(),
  align: z.enum(TEXT_ALIGNS).optional(),
});

export type TextProps = z.infer<typeof textProps>;
