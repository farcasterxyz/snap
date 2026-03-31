import { z } from "zod/v4";

const listItemZ = z.object({
  content: z.string(),
  trailing: z.string().optional(),
});

export const listProps = z.object({
  style: z.enum(["ordered", "unordered", "plain"]).optional(),
  items: z.array(listItemZ).min(1).max(4),
});

export type ListProps = z.infer<typeof listProps>;
