import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export function SnapStack({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const direction = String(props.direction ?? "vertical");
  const gap = typeof props.gap === "number" ? props.gap : 12;
  const isHorizontal = direction === "horizontal";

  return (
    <View
      style={[
        styles.stack,
        isHorizontal && styles.horizontal,
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
    flexWrap: "wrap",
  },
});
