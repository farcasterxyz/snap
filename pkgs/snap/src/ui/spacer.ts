import { z } from "zod";
import { SPACER_SIZE_VALUES } from "../constants.js";

export const spacerProps = z.object({
  size: z.enum(SPACER_SIZE_VALUES).optional(),
});

export type SpacerProps = z.infer<typeof spacerProps>;
