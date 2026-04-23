import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SnapThemeProvider, useSnapTheme, type SnapNativeColors } from "../theme";
import {
  SnapLoadingOverlay,
  SnapViewCoreInner,
  resolveAccentHex,
} from "../snap-view-core";
import {
  validateSnapResponse,
  type ValidationResult,
} from "@farcaster/snap";
import type { SnapPage, SnapActionHandlers } from "../types";

// ─── Constants ───────────────────────────────────────

const SNAP_MAX_HEIGHT = 500;
const SNAP_WARNING_HEIGHT = 700;
const SHOW_MORE_OVERHANG = 14;

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
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
  loadingOverlay?: ReactNode;
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
    <SnapViewCoreInner
      snap={snap}
      handlers={handlers}
      loading={loading}
      loadingOverlay={loadingOverlay}
    />
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
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapViewV2Inner
        snap={snap}
        handlers={handlers}
        loading={loading}
        onValidationError={onValidationError}
        validationErrorFallback={validationErrorFallback}
        loadingOverlay={loadingOverlay}
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
  actionError,
  appearance,
  plain,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  borderRadius: number;
  showOverflowWarning: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
  actionError?: string | null;
  appearance: "light" | "dark";
  plain: boolean;
  loadingOverlay?: ReactNode;
}) {
  const { colors, mode } = useSnapTheme();
  const accentHex = resolveAccentHex(snap.theme?.accent, mode);
  const [contentHeight, setContentHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setContentHeight(0);
  }, [snap]);

  const isExpandable = !showOverflowWarning && contentHeight > SNAP_MAX_HEIGHT + 1;
  const isClipped = isExpandable && !isExpanded;

  const content = (
    <SnapViewV2Inner
      snap={snap}
      handlers={handlers}
      loading={loading}
      onValidationError={onValidationError}
      validationErrorFallback={validationErrorFallback}
      loadingOverlay={null}
    />
  );

  if (plain) {
    return (
      <>
        <View style={isClipped ? { maxHeight: SNAP_MAX_HEIGHT, overflow: "hidden" } : undefined}>
          <View
            collapsable={false}
            onLayout={(e) => {
              const nextHeight = Math.round(e.nativeEvent.layout.height);
              setContentHeight((current) =>
                isClipped
                  ? Math.max(current, nextHeight)
                  : current === nextHeight
                    ? current
                    : nextHeight,
              );
            }}
          >
            {content}
          </View>
        </View>
        {loading
          ? loadingOverlay === undefined
            ? <SnapLoadingOverlay appearance={mode} accentHex={accentHex} />
            : loadingOverlay
          : null}
        {isExpandable ? (
          <View style={[cardStyles.expandRow, cardStyles.expandRowPlain]}>
            <Pressable
              style={({ pressed }) => [
                cardStyles.expandButton,
                {
                  backgroundColor: pressed ? colors.mutedHover : colors.muted,
                },
              ]}
              onPress={() => setIsExpanded((value) => !value)}
            >
              <Text style={[cardStyles.expandButtonText, { color: colors.text }]}>
                {isExpanded ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </>
    );
  }

  const overflowAmount = showOverflowWarning ? contentHeight - SNAP_MAX_HEIGHT : 0;
  const isDark = mode === "dark";
  const pillBg = isDark ? "rgba(40,40,40,0.92)" : "rgba(255,255,255,0.92)";
  const pillBgPressed = isDark ? "rgba(60,60,60,0.95)" : "rgba(240,240,240,0.95)";

  return (
    <View style={{ paddingBottom: isExpandable ? SHOW_MORE_OVERHANG : 0 }}>
      <View style={{ position: "relative" }}>
        <View
          style={{
            borderRadius,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            maxHeight: showOverflowWarning ? undefined : isClipped ? SNAP_MAX_HEIGHT : undefined,
            overflow: "hidden",
            minHeight: 120,
          }}
        >
          <View
            collapsable={false}
            onLayout={(e) => {
              const nextHeight = Math.round(e.nativeEvent.layout.height);
              setContentHeight((current) =>
                isClipped
                  ? Math.max(current, nextHeight)
                  : current === nextHeight
                    ? current
                    : nextHeight,
              );
            }}
            style={{ paddingHorizontal: 16, paddingVertical: 16 }}
          >
            {content}
          </View>
          {showOverflowWarning && contentHeight > SNAP_MAX_HEIGHT && (
            <View style={{ position: "absolute", top: SNAP_MAX_HEIGHT, left: 0, right: 0, height: overflowAmount, zIndex: 10, pointerEvents: "none" }}>
              <View style={{ height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,100,100,0.6)" }} />
              <View style={{ position: "absolute", top: -10, right: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                <Text style={{ fontSize: 10, color: "rgba(255,100,100,0.7)", fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) }}>{SNAP_MAX_HEIGHT}px</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(255,50,50,0.15)" }} />
            </View>
          )}
          {loading
            ? loadingOverlay === undefined
              ? <SnapLoadingOverlay appearance={mode} accentHex={accentHex} />
              : loadingOverlay
            : null}
        </View>
        {isExpandable ? (
          <View pointerEvents="box-none" style={cardStyles.expandFloat}>
            <Pressable
              style={({ pressed }) => [
                cardStyles.expandButton,
                {
                  backgroundColor: pressed ? pillBgPressed : pillBg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsExpanded((value) => !value)}
            >
              <Text style={[cardStyles.expandButtonText, { color: colors.text }]}>
                {isExpanded ? "Show less" : "Show more"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {actionError && (
        <Text
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 13,
            color:
              appearance === "dark"
                ? "rgba(255,100,100,0.9)"
                : "rgba(200,0,0,0.8)",
          }}
        >
          {actionError}
        </Text>
      )}
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
  actionError,
  plain = false,
  loadingOverlay,
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
  actionError?: string | null;
  plain?: boolean;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
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
        actionError={actionError}
        appearance={appearance}
        plain={plain}
        loadingOverlay={loadingOverlay}
      />
    </SnapThemeProvider>
  );
}

const cardStyles = StyleSheet.create({
  frameRing: { alignSelf: "stretch" },
  card: { borderWidth: 1, minHeight: 120, overflow: "hidden" },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  actionError: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  expandFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -14,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  expandRowPlain: {
    paddingTop: 8,
    alignItems: "center",
  },
  expandButton: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
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
