import type { ReactNode } from "react";
import type { ValidationResult } from "@farcaster/snap";
import type { SnapNativeColors } from "./theme";
import type { JsonValue, SnapPage, SnapActionHandlers } from "./types";
import { useSnapTheme } from "./theme";
import { hexToRgba } from "./use-snap-palette";
import { SnapViewV1, SnapCardV1 } from "./v1/snap-view";
import { SnapViewV2, SnapCardV2 } from "./v2/snap-view";

// ─── Public types ──────────────────────────────────────

export type { JsonValue, SnapPage, SnapActionHandlers } from "./types";

// ─── Re-exports ───────────────────────────────────────

export { useSnapTheme, hexToRgba };
export type { SnapNativeColors };

// ─── SnapView (version-switching) ─────────────────────

export function SnapView({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  colors,
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  /** Called when snap validation fails (v2 only). */
  onValidationError?: (result: ValidationResult) => void;
  /** Custom fallback rendered when validation fails (v2 only). Defaults to a built-in message. Pass `null` to render nothing. */
  validationErrorFallback?: ReactNode;
}) {
  if (snap.version === "2.0") {
    return (
      <SnapViewV2
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
        colors={colors}
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
      colors={colors}
    />
  );
}

// ─── SnapCard (version-switching) ─────────────────────

export function SnapCard({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  colors,
  borderRadius = 16,
  showOverflowWarning = false,
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  /** Border radius of the card (default 16). */
  borderRadius?: number;
  /** When true (v2 only), extends to 700px and shows a warning overlay below 500px. When false, clips at 500px. */
  showOverflowWarning?: boolean;
  /** Called when snap validation fails (v2 only). */
  onValidationError?: (result: ValidationResult) => void;
  /** Custom fallback rendered when validation fails (v2 only). */
  validationErrorFallback?: ReactNode;
}) {
  if (snap.version === "2.0") {
    return (
      <SnapCardV2
        snap={snap}
        handlers={handlers}
        loading={loading}
        appearance={appearance}
        colors={colors}
        borderRadius={borderRadius}
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
      colors={colors}
      borderRadius={borderRadius}
    />
  );
}
