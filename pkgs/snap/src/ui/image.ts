import { z } from "zod";
import { IMAGE_ASPECT_VALUES } from "../constants.js";

export const imageProps = z.object({
  url: z.string(),
  aspect: z.enum(IMAGE_ASPECT_VALUES),
  alt: z.string().optional(),
});

export type ImageProps = z.infer<typeof imageProps>;
