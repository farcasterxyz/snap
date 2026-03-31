import { z } from "zod/v4";

export const imageProps = z.object({
  url: z.string(),
  aspect: z.enum(["1:1", "16:9", "4:3", "3:4", "9:16"]),
  alt: z.string().optional(),
});

export type ImageProps = z.infer<typeof imageProps>;
