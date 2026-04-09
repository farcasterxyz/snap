"use client";

import type { Spec } from "@json-render/core";
import type { ReactNode } from "react";
import type { ValidationResult } from "../validator.js";
import { SPEC_VERSION_2 } from "../constants";
import { SnapCardV1 } from "./v1/snap-view";
import { SnapCardV2 } from "./v2/snap-view";

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
  open_snap: (target: string) => void;
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
  actionError,
  plain = false,
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
  /** Server-side action error message to display inline. */
  actionError?: string | null;
  /** When true, renders without card frame (no border, background, or padding). */
  plain?: boolean;
}) {
  if (snap.version === SPEC_VERSION_2) {
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
        actionError={actionError}
        plain={plain}
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
      actionError={actionError}
      plain={plain}
    />
  );
}
