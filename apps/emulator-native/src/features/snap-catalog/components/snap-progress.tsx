import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";
import { useTheme } from "../../../ThemeContext";

export function SnapProgress({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useTheme();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const label = props.label != null ? String(props.label) : null;

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.percent, { color: colors.textSecondary }]}>
            {Math.round(percent)}%
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: accentHex }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: "100%", gap: 4 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 13 },
  percent: { fontSize: 13 },
  track: {
    height: 10,
    borderRadius: 9999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 9999,
  },
});
