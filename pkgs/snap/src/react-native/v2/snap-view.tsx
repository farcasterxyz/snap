import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SnapThemeProvider, useSnapTheme, type SnapNativeColors } from "../theme";
import { SnapViewCoreInner } from "../snap-view-core";
import {
  validateSnapResponse,
  type ValidationResult,
} from "@farcaster/snap";
import type { SnapPage, SnapActionHandlers } from "../types";

// ─── Constants ───────────────────────────────────────

const SNAP_MAX_HEIGHT = 500;
const SNAP_WARNING_HEIGHT = 700;

// ─── Validation fallback ─────────────────────────────

function SnapValidationFallback({ message }: { message?: string }) {
  const { colors } = useSnapTheme();
  return (
    <View style={fallbackStyles.container}>
      <Text style={[fallbackStyles.text, { color: colors.textSecondary }]}>
        {message ? `Unable to render snap: ${message}` : "Unable to render snap"}
      </Text>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
  },
});

// ─── SnapViewV2 (with validation) ────────────────────

export function SnapViewV2Inner({
  snap,
  handlers,
  loading = false,
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  const validation = useMemo(() => validateSnapResponse(snap), [snap]);
  const valid = validation.valid;
  const validationMessage = validation.issues[0]?.message;

  useEffect(() => {
    if (!valid) {
      if (onValidationError) {
        onValidationError(validation);
      } else {
        // eslint-disable-next-line no-console
        console.warn("[Snap] validation issues:", validation.issues);
      }
    }
  }, [valid, validation, onValidationError]);

  if (!valid) {
    if (validationErrorFallback === null) return null;
    return (
      <>{validationErrorFallback ?? <SnapValidationFallback message={validationMessage} />}</>
    );
  }

  return (
    <SnapViewCoreInner snap={snap} handlers={handlers} loading={loading} />
  );
}

export function SnapViewV2({
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
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapViewV2Inner
        snap={snap}
        handlers={handlers}
        loading={loading}
        onValidationError={onValidationError}
        validationErrorFallback={validationErrorFallback}
      />
    </SnapThemeProvider>
  );
}

// ─── SnapCardV2 (card frame + height limits) ─────────

function SnapCardV2Inner({
  snap,
  handlers,
  loading,
  borderRadius,
  showOverflowWarning,
  onValidationError,
  validationErrorFallback,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  borderRadius: number;
  showOverflowWarning: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  const { colors } = useSnapTheme();
  const maxHeight = showOverflowWarning ? SNAP_WARNING_HEIGHT : SNAP_MAX_HEIGHT;

  return (
    <View style={cardStyles.frameRing}>
      <View
        style={[
          cardStyles.card,
          {
            borderRadius,
            maxHeight,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={cardStyles.body}>
          <SnapViewV2Inner
            snap={snap}
            handlers={handlers}
            loading={loading}
            onValidationError={onValidationError}
            validationErrorFallback={validationErrorFallback}
          />
        </View>
        {showOverflowWarning && (
          <View style={cardStyles.warningOverlay}>
            <View style={cardStyles.warningLine} />
            <View style={cardStyles.warningLabel}>
              <Text style={cardStyles.warningLabelText}>{SNAP_MAX_HEIGHT}px</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export function SnapCardV2({
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
  borderRadius?: number;
  showOverflowWarning?: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapCardV2Inner
        snap={snap}
        handlers={handlers}
        loading={loading}
        borderRadius={borderRadius}
        showOverflowWarning={showOverflowWarning}
        onValidationError={onValidationError}
        validationErrorFallback={validationErrorFallback}
      />
    </SnapThemeProvider>
  );
}

const cardStyles = StyleSheet.create({
  frameRing: { alignSelf: "stretch" },
  card: { overflow: "hidden", borderWidth: 1, minHeight: 120 },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  warningOverlay: {
    position: "absolute",
    top: SNAP_MAX_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  warningLine: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,100,100,0.6)",
  },
  warningLabel: {
    position: "absolute",
    top: -10,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  warningLabelText: {
    fontSize: 10,
    color: "rgba(255,100,100,0.7)",
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
