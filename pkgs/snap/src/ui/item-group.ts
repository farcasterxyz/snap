import { z } from "zod";

export const itemGroupProps = z.object({});

export type ItemGroupProps = z.infer<typeof itemGroupProps>;
