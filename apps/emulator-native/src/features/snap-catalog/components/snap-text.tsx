import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";

export function SnapText({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const style = String(props.style ?? "body");
  const content = String(props.content ?? "");
  const align =
    (props.align as "left" | "center" | "right" | undefined) ?? "left";

  const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";

  const textStyle =
    style === "title"
      ? styles.title
      : style === "caption"
        ? styles.caption
        : style === "label"
          ? styles.label
          : styles.body;

  return (
    <View style={styles.wrap}>
      <Text style={[textStyle, { textAlign }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  body: { fontSize: 16, color: "#111827", lineHeight: 22 },
  caption: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
});
