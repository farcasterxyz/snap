import { z } from "zod";
import { BUTTON_ACTION_VALUES, BUTTON_STYLE_VALUES } from "../constants.js";

export const actionButtonProps = z.object({
  label: z.string(),
  action: z.enum(BUTTON_ACTION_VALUES),
  target: z.string().optional(),
  client_action: z.record(z.string(), z.unknown()).optional(),
  style: z.enum(BUTTON_STYLE_VALUES).optional(),
});

export type ActionButtonProps = z.infer<typeof actionButtonProps>;

/** Same schema as `actionButtonProps` (legacy export name). */
export const buttonProps = actionButtonProps;
export type ButtonProps = ActionButtonProps;
