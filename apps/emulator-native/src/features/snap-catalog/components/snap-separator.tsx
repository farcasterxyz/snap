import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../ThemeContext";

export function SnapSeparator({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { colors } = useTheme();
  const orientation = String(props.orientation ?? "horizontal");
  const isVertical = orientation === "vertical";

  return (
    <View
      style={[
        isVertical ? styles.vertical : styles.horizontal,
        { backgroundColor: colors.border },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: "100%",
    height: 1,
  },
  vertical: {
    height: "100%",
    width: 1,
    alignSelf: "stretch",
  },
});
