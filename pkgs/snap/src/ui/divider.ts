import { z } from "zod/v4";

export const dividerProps = z.object({});

export type DividerProps = z.infer<typeof dividerProps>;
