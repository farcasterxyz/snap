import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";

export function SnapProgress({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const label = props.label != null ? String(props.label) : null;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: accentHex }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 4 },
  label: { fontSize: 13, lineHeight: 18 },
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
