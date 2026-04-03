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

const JUSTIFY: Record<string, "flex-start" | "center" | "flex-end" | "space-between" | "space-around"> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
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
  const justify = props.justify ? JUSTIFY[String(props.justify)] : undefined;

  return (
    <View
      style={[
        styles.stack,
        isHorizontal ? styles.horizontal : undefined,
        { gap },
        justify ? { justifyContent: justify } : undefined,
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
    flexWrap: "wrap",
  },
});
