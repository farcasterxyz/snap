import { z } from "zod";

export const paginatorProps = z.object({
  initialPage: z.number().int().min(0).optional(),
  showIndicators: z.boolean().optional(),
  showControls: z.boolean().optional(),
});

export type PaginatorProps = z.infer<typeof paginatorProps>;
