import { z } from "zod";

export const buttonProps = z.object({
  label: z.string(),
  action: z.enum(["post", "link", "mini_app", "sdk"]),
  target: z.string(),
  style: z.enum(["primary", "secondary"]).optional(),
});

export type ButtonProps = z.infer<typeof buttonProps>;
