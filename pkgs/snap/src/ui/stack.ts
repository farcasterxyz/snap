import { z } from "zod";

export const stackProps = z.object({});

export type StackProps = z.infer<typeof stackProps>;
