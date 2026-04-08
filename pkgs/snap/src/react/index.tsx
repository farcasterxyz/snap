"use client";

import type { Spec } from "@json-render/core";
import type { ReactNode } from "react";
import type { ValidationResult } from "../validator.js";
import { SnapViewV1, SnapCardV1 } from "./v1/snap-view";
import { SnapViewV2, SnapCardV2 } from "./v2/snap-view";

// ─── Public types ──────────────────────────────────────

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPage = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  ui: Spec;
};

export type SnapActionHandlers = {
  submit: (target: string, inputs: Record<string, JsonValue>) => void;
  open_url: (target: string) => void;
  open_mini_app: (target: string) => void;
  view_cast: (params: { hash: string }) => void;
  view_profile: (params: { fid: number }) => void;
  compose_cast: (params: {
    text?: string;
    channelKey?: string;
    embeds?: string[];
  }) => void;
  view_token: (params: { token: string }) => void;
  send_token: (params: {
    token: string;
    amount?: string;
    recipientFid?: number;
    recipientAddress?: string;
  }) => void;
  swap_token: (params: { sellToken?: string; buyToken?: string }) => void;
};

// ─── SnapView ──────────────────────────────────────────

export function SnapView({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  if (snap.version === "2.0") {
    return (
      <SnapViewV2
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
        onValidationError={onValidationError}
        validationErrorFallback={validationErrorFallback}
      />
    );
  }

  return (
    <SnapViewV1
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={appearance}
    />
  );
}

// ─── SnapCard ────────────────────────────────────────

export function SnapCard({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  maxWidth = 480,
  showOverflowWarning = false,
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  /** When true, extends to 700px and shows a warning overlay below 500px. When false, clips at 500px. Only applies to v2 snaps. */
  showOverflowWarning?: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  if (snap.version === "2.0") {
    return (
      <SnapCardV2
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
        maxWidth={maxWidth}
        showOverflowWarning={showOverflowWarning}
        onValidationError={onValidationError}
        validationErrorFallback={validationErrorFallback}
      />
    );
  }

  return (
    <SnapCardV1
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={appearance}
      maxWidth={maxWidth}
    />
  );
}
