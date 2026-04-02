import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, View } from "react-native";

export function SnapSpacer({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const size = String(props.size ?? "medium");
  const h =
    size === "small" ? 6 : size === "large" ? 20 : 12;
  return <View style={[styles.box, { height: h }]} />;
}

const styles = StyleSheet.create({
  box: { width: "100%" },
});
