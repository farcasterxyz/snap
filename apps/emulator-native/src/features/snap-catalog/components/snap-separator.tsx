import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, View } from "react-native";

export function SnapSeparator({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const orientation = String(props.orientation ?? "horizontal");
  const isVertical = orientation === "vertical";

  return (
    <View
      style={
        isVertical ? styles.vertical : styles.horizontal
      }
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
  },
  vertical: {
    height: "100%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
  },
});
