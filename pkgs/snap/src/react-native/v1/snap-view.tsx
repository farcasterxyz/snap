import { type ReactNode, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SnapThemeProvider, useSnapTheme, type SnapNativeColors } from "../theme";
import {
  SnapLoadingOverlay,
  SnapViewCoreInner,
  resolveAccentHex,
} from "../snap-view-core";
import type { SnapPage, SnapActionHandlers } from "../types";
import { getSnapExpansionState } from "../expand-state";

// ─── SnapViewV1 (no validation) ──────────────────────

export function SnapViewV1Inner({
  snap,
  handlers,
  loading = false,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  loadingOverlay?: ReactNode;
}) {
  return (
    <SnapViewCoreInner
      snap={snap}
      handlers={handlers}
      loading={loading}
      loadingOverlay={loadingOverlay}
    />
  );
}

export function SnapViewV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  colors,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapViewV1Inner
        snap={snap}
        handlers={handlers}
        loading={loading}
        loadingOverlay={loadingOverlay}
      />
    </SnapThemeProvider>
  );
}

// ─── SnapCardV1 (card frame with expandable clipping) ──

function SnapCardV1Inner({
  snap,
  handlers,
  loading = false,
  borderRadius,
  actionError,
  appearance,
  plain,
  loadingOverlay,
  forceExpanded,
  expandButtonLabel,
  onExpandPress,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  borderRadius: number;
  actionError?: string | null;
  appearance: "light" | "dark";
  plain: boolean;
  loadingOverlay?: ReactNode;
  forceExpanded?: boolean;
  expandButtonLabel?: string;
  onExpandPress?: () => void;
}) {
  const { colors, mode } = useSnapTheme();
  const accentHex = resolveAccentHex(snap.theme?.accent, mode);
  const [contentHeight, setContentHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setContentHeight(0);
  }, [snap]);

  const expansion = getSnapExpansionState({
    contentHeight,
    internalExpanded: isExpanded,
    forceExpanded,
    onExpandPress,
    expandButtonLabel,
  });
  const expandButtonInsideCard = typeof onExpandPress === "function";

  const isDark = mode === "dark";
  const pillBg = isDark ? "rgba(40,40,40,0.92)" : "rgba(255,255,255,0.92)";
  const pillBgPressed = isDark ? "rgba(60,60,60,0.95)" : "rgba(240,240,240,0.95)";
  return (
    <>
      <View style={cardStyles.frameRing}>
        <View
          style={[
            plain ? undefined : cardStyles.card,
            plain ? undefined : {
              borderRadius,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View
            style={
              expansion.clipped
                ? { maxHeight: expansion.maxHeight, overflow: "hidden" }
                : undefined
            }
          >
            <View
              collapsable={false}
              onLayout={(event) => {
                const nextHeight = Math.round(event.nativeEvent.layout.height);
                setContentHeight((currentHeight) =>
                  expansion.clipped
                    ? Math.max(currentHeight, nextHeight)
                    : currentHeight === nextHeight
                      ? currentHeight
                      : nextHeight,
                );
              }}
              style={plain ? undefined : cardStyles.body}
            >
              <SnapViewV1Inner
                snap={snap}
                handlers={handlers}
                loading={loading}
                loadingOverlay={null}
              />
            </View>
          </View>
          {loading
            ? loadingOverlay === undefined
              ? <SnapLoadingOverlay appearance={mode} accentHex={accentHex} />
              : loadingOverlay
            : null}
        </View>
        {expansion.showButton ? (
          <View
            pointerEvents="box-none"
            style={
              expandButtonInsideCard
                ? cardStyles.expandFloatInset
                : cardStyles.expandFloat
            }
          >
            <Pressable
              style={({ pressed }) => [
                cardStyles.expandButton,
                {
                  backgroundColor: pressed ? pillBgPressed : pillBg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => {
                if (expansion.useInternalToggle) {
                  setIsExpanded((value) => !value);
                } else {
                  onExpandPress?.();
                }
              }}
            >
              <Text
                style={[cardStyles.expandButtonText, { color: colors.text }]}
              >
                {expansion.buttonLabel}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {actionError && (
        <Text
          style={[
            cardStyles.actionError,
            {
              color:
                appearance === "dark"
                  ? "rgba(255,100,100,0.9)"
                  : "rgba(200,0,0,0.8)",
            },
          ]}
        >
          {actionError}
        </Text>
      )}
    </>
  );
}

export function SnapCardV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  colors,
  borderRadius = 16,
  actionError,
  plain = false,
  loadingOverlay,
  forceExpanded,
  expandButtonLabel,
  onExpandPress,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  borderRadius?: number;
  actionError?: string | null;
  plain?: boolean;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
  /** When true, render full content height without 500px clipping or expand controls. */
  forceExpanded?: boolean;
  /** Custom label for the collapsed expand button. */
  expandButtonLabel?: string;
  /** Called from the collapsed expand button instead of toggling internal state. */
  onExpandPress?: () => void;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapCardV1Inner
        snap={snap}
        handlers={handlers}
        loading={loading}
        borderRadius={borderRadius}
        actionError={actionError}
        appearance={appearance}
        plain={plain}
        loadingOverlay={loadingOverlay}
        forceExpanded={forceExpanded}
        expandButtonLabel={expandButtonLabel}
        onExpandPress={onExpandPress}
      />
    </SnapThemeProvider>
  );
}

const cardStyles = StyleSheet.create({
  frameRing: { alignSelf: "stretch" },
  card: { overflow: "hidden", borderWidth: 1, minHeight: 120 },
  body: { paddingHorizontal: 8, paddingVertical: 8 },
  expandFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -14,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  expandFloatInset: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
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
  actionError: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
});
