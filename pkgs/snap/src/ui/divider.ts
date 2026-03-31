import { z } from "zod";

export const dividerProps = z.object({});

export type DividerProps = z.infer<typeof dividerProps>;
