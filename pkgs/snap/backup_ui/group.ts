import { z } from "zod";
import { GROUP_LAYOUT_VALUES } from "../constants.js";

export const groupProps = z.object({
  layout: z.enum(GROUP_LAYOUT_VALUES),
});

export type GroupProps = z.infer<typeof groupProps>;
