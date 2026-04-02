import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";

type ListItem = { content?: string; trailing?: string };

export function SnapList({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const style = String(props.style ?? "ordered");
  const items = Array.isArray(props.items) ? (props.items as ListItem[]) : [];

  return (
    <View style={styles.wrap}>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.bullet}>
            {style === "ordered"
              ? `${i + 1}. `
              : style === "unordered"
                ? "• "
                : ""}
          </Text>
          <View style={styles.textCol}>
            <Text style={styles.content}>{String(item.content ?? "")}</Text>
            {item.trailing != null ? (
              <Text style={styles.trailing}>{String(item.trailing)}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6, paddingLeft: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  bullet: { fontSize: 14, color: "#6b7280", minWidth: 20 },
  textCol: { flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  content: { fontSize: 14, color: "#111827", flex: 1 },
  trailing: { fontSize: 13, color: "#6b7280" },
});
