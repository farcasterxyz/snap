import { View, Text, StyleSheet } from "react-native";
import { SnapThemeProvider, useSnapTheme, type SnapNativeColors } from "../theme";
import { SnapViewCoreInner } from "../snap-view-core";
import type { SnapPage, SnapActionHandlers } from "../types";

// ─── SnapViewV1 (no validation, no height limits) ────

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

// ─── SnapCardV1 (card frame, no height limits) ───────

function SnapCardV1Inner({
  snap,
  handlers,
  loading = false,
  borderRadius,
  actionError,
  appearance,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  borderRadius: number;
  actionError?: string | null;
  appearance: "light" | "dark";
}) {
  const { colors } = useSnapTheme();

  return (
    <>
      <View style={cardStyles.frameRing}>
        <View
          style={[
            cardStyles.card,
            {
              borderRadius,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View style={cardStyles.body}>
            <SnapViewV1Inner snap={snap} handlers={handlers} loading={loading} />
          </View>
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
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  borderRadius?: number;
  actionError?: string | null;
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
      />
    </SnapThemeProvider>
  );
}

const cardStyles = StyleSheet.create({
  frameRing: { alignSelf: "stretch" },
  card: { overflow: "hidden", borderWidth: 1, minHeight: 120 },
  body: { paddingHorizontal: 16, paddingVertical: 16 },
  actionError: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
});
