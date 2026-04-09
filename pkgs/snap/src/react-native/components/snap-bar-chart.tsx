import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";

export function SnapBarChart({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex, hex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const bars = Array.isArray(props.bars) ? props.bars : [];
  const chartColor = String(props.color ?? "accent");
  const maxVal =
    props.max != null
      ? Number(props.max)
      : Math.max(
          ...bars.map((b: { value?: number }) => Number(b.value ?? 0)),
          1,
        );

  function barFill(bar: { color?: string }): string {
    if (bar.color) return hex(bar.color);
    if (chartColor !== "accent") return hex(chartColor);
    return accentHex;
  }

  return (
    <View style={styles.wrap}>
      {bars.map(
        (
          bar: { label?: string; value?: number; color?: string },
          i: number,
        ) => {
          const value = Number(bar.value ?? 0);
          const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
          return (
            <View key={i} style={styles.row}>
              <Text
                style={[styles.label, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {String(bar.label ?? "")}
              </Text>
              <View style={[styles.track, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${pct}%`,
                      backgroundColor: barFill(bar),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.value, { color: colors.textSecondary }]}>
                {value}
              </Text>
            </View>
          );
        },
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 80, fontSize: 12, lineHeight: 16, textAlign: "right" },
  track: { flex: 1, height: 10, borderRadius: 9999, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 9999 },
  value: { width: 32, fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] },
});
