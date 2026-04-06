import { z } from "zod";

export const IMAGE_ASPECTS = ["1:1", "16:9", "4:3", "9:16"] as const;

export const imageProps = z.object({
  url: z.string(),
  aspect: z.enum(IMAGE_ASPECTS),
  alt: z.string().optional(),
});

export type ImageProps = z.infer<typeof imageProps>;
