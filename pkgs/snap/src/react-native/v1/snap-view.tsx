import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SnapThemeProvider, useSnapTheme, type SnapNativeColors } from "../theme";
import { SnapViewCoreInner } from "../snap-view-core";
import type { SnapPage, SnapActionHandlers } from "../types";

const SNAP_MAX_HEIGHT = 500;

// ─── SnapViewV1 (no validation) ──────────────────────

export function SnapViewV1Inner({
  snap,
  handlers,
  loading = false,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
}) {
  return (
    <SnapViewCoreInner snap={snap} handlers={handlers} loading={loading} />
  );
}

export function SnapViewV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  colors,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
}) {
  return (
    <SnapThemeProvider appearance={appearance} colors={colors}>
      <SnapViewV1Inner snap={snap} handlers={handlers} loading={loading} />
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
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  borderRadius: number;
  actionError?: string | null;
  appearance: "light" | "dark";
  plain: boolean;
}) {
  const { colors } = useSnapTheme();
  const [contentHeight, setContentHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setContentHeight(0);
  }, [snap]);

  const isExpandable = contentHeight > SNAP_MAX_HEIGHT + 1;
  const isClipped = isExpandable && !isExpanded;

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
            style={isClipped ? { maxHeight: SNAP_MAX_HEIGHT, overflow: "hidden" } : undefined}
          >
            <View
              collapsable={false}
              onLayout={(event) => {
                const nextHeight = Math.round(event.nativeEvent.layout.height);
                setContentHeight((currentHeight) =>
                  isClipped
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
              />
            </View>
          </View>
          {isExpandable ? (
            <View
              style={[
                cardStyles.expandRow,
                plain
                  ? cardStyles.expandRowPlain
                  : { borderTopColor: colors.border },
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  cardStyles.expandButton,
                  {
                    backgroundColor: pressed
                      ? colors.mutedHover
                      : colors.muted,
                  },
                ]}
                onPress={() => {
                  setIsExpanded((value) => !value);
                }}
              >
                <Text
                  style={[cardStyles.expandButtonText, { color: colors.text }]}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
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
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  borderRadius?: number;
  actionError?: string | null;
  plain?: boolean;
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
      />
    </SnapThemeProvider>
  );
}

const cardStyles = StyleSheet.create({
  frameRing: { alignSelf: "stretch" },
  card: { overflow: "hidden", borderWidth: 1, minHeight: 120 },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  expandRow: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expandRowPlain: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 0,
    borderTopWidth: 0,
  },
  expandButton: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expandButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  actionError: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
});
