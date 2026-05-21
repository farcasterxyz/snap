import { z } from "zod";

export const IMAGE_ASPECTS = ["1:1", "16:9", "4:3", "9:16", "4:1"] as const;

export const imageProps = z.object({
  url: z.string(),
  aspect: z.enum(IMAGE_ASPECTS),
  alt: z.string().optional(),
  title: z.string().min(1).max(80).optional(),
  subtitle: z.string().min(1).max(120).optional(),
});

export type ImageProps = z.infer<typeof imageProps>;
