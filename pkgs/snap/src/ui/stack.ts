import { z } from "zod/v4";

export const stackProps = z.object({});

export type StackProps = z.infer<typeof stackProps>;
