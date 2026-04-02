import { z } from "zod";
import { SPACER_SIZE, SPACER_SIZE_VALUES } from "../constants.js";

export const spacerProps = z.object({
  size: z.enum(SPACER_SIZE_VALUES).default(SPACER_SIZE.medium),
});

export type SpacerProps = z.infer<typeof spacerProps>;
