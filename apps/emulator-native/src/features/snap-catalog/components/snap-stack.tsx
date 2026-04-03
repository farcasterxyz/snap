import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const VGAP: Record<string, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

const HGAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
};

export function SnapStack({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const direction = String(props.direction ?? "vertical");
  const rawGap = props.gap;
  const isHorizontal = direction === "horizontal";
  const gapMap = isHorizontal ? HGAP : VGAP;
  const gap =
    typeof rawGap === "number"
      ? rawGap
      : typeof rawGap === "string" && rawGap in gapMap
        ? gapMap[rawGap]!
        : isHorizontal ? HGAP.md! : VGAP.md!;

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
