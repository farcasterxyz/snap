/**
 * Source of truth for normalization/unwrap logic: `apps/emulator/src/lib/snapProxyNormalize.ts`.
 * Duplicated here so the native emulator stays self-contained.
 */

import type { Spec } from "@json-render/core";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPageResponse = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  spec: Spec;
};

/** Validate that the response has the expected spec shape. */
function validateSpec(
  spec: unknown,
): spec is SnapPageResponse["spec"] {
  if (!spec || typeof spec !== "object") return false;
  const s = spec as Record<string, unknown>;
  return (
    typeof s.root === "string" &&
    typeof s.elements === "object" &&
    s.elements !== null &&
    !Array.isArray(s.elements)
  );
}

/** Unwrap response and validate shape. */
export function parseSnapPayload(payload: unknown): SnapPageResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Snap response is not valid JSON");
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.version !== "string") {
    throw new Error("Snap response must include version");
  }

  if (!validateSpec(candidate.spec)) {
    throw new Error(
      'Snap response must include spec: { root: "...", elements: { ... } }',
    );
  }

  return {
    version: candidate.version,
    theme: candidate.theme as SnapPageResponse["theme"],
    effects: candidate.effects as SnapPageResponse["effects"],
    spec: candidate.spec as SnapPageResponse["spec"],
  };
}

/** Prefer inner `{ version, spec }` for Zod validation. */
export function unwrapSnapResponseJsonForValidation(json: unknown): unknown {
  if (
    json &&
    typeof json === "object" &&
    !Array.isArray(json) &&
    "snap" in json &&
    (json as { snap?: unknown }).snap &&
    typeof (json as { snap: unknown }).snap === "object"
  ) {
    return (json as { snap: unknown }).snap;
  }
  return json;
}
