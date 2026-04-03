import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../ThemeContext";

export function SnapItemGroup({
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.group, { borderColor: colors.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
});
