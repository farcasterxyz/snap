import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const GAP_MAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
};

export function SnapStack({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const direction = String(props.direction ?? "vertical");
  const rawGap = props.gap;
  const gap =
    typeof rawGap === "number"
      ? rawGap
      : typeof rawGap === "string" && rawGap in GAP_MAP
        ? GAP_MAP[rawGap]!
        : GAP_MAP.md;
  const isHorizontal = direction === "horizontal";

  return (
    <View
      style={[
        styles.stack,
        isHorizontal ? styles.horizontal : undefined,
        { gap },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
  },
  horizontal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
});
