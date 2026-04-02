import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export function SnapStack({
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  return <View style={styles.stack}>{children}</View>;
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    gap: 12,
  },
});
