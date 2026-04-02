import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

export function SnapProgress({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { hex } = useSnapPalette();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const semantic = String(props.color ?? "accent");
  const fill = hex(semantic);

  return (
    <View style={styles.wrap}>
      {props.label != null ? (
        <Text style={styles.label}>{String(props.label)}</Text>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6 },
  label: { fontSize: 12, color: "#6b7280" },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
