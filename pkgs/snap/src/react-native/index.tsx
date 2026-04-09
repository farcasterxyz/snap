import type { ReactNode } from "react";
import type { ValidationResult } from "@farcaster/snap";
import { SPEC_VERSION_2 } from "@farcaster/snap";
import type { SnapNativeColors } from "./theme";
import type { JsonValue, SnapPage, SnapActionHandlers } from "./types";
import { useSnapTheme } from "./theme";
import { hexToRgba } from "./use-snap-palette";
import { SnapCardV1 } from "./v1/snap-view";
import { SnapCardV2 } from "./v2/snap-view";

// ─── Public types ──────────────────────────────────────

export type { JsonValue, SnapPage, SnapActionHandlers } from "./types";

// ─── Re-exports ───────────────────────────────────────

export { useSnapTheme, hexToRgba };
export type { SnapNativeColors };

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
  actionError,
  plain = false,
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
        colors={colors}
        borderRadius={borderRadius}
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
      colors={colors}
      borderRadius={borderRadius}
      actionError={actionError}
      plain={plain}
    />
  );
}
