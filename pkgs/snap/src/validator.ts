import { z } from "zod";
import { snapResponseSchema } from "./schemas";

export type ValidationResult = {
  valid: boolean;
  issues: z.core.$ZodIssue[];
};

/**
 * Validates a snap response against the schema.
 * Element-level prop validation is handled by the json-render catalog.
 * This validates the snap envelope (version, theme, effects, spec shape).
 */
export function validateSnapResponse(json: unknown): ValidationResult {
  const parsed = snapResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues,
    };
  }
  return { valid: true, issues: [] };
}
