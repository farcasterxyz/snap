import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import Slider from "@react-native-community/slider";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";

export function SnapSlider({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const name = String(props.name ?? "slider");
  const path = `/inputs/${name}`;
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = props.step != null ? Number(props.step) : 1;
  const fallback =
    props.defaultValue != null ? Number(props.defaultValue) : (min + max) / 2;
  const raw = get(path);
  const value =
    raw === undefined || raw === null ? fallback : Number(raw);
  const clamped = Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

  const label = props.label != null ? String(props.label) : null;
  const showValue = props.showValue === true;
  const minLabel = props.minLabel != null ? String(props.minLabel) : null;
  const maxLabel = props.maxLabel != null ? String(props.maxLabel) : null;

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {showValue && (
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>
              {String(Math.round(clamped))}
            </Text>
          )}
        </View>
      ) : null}
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step > 0 ? step : 1}
        value={clamped}
        onValueChange={(v) => set(path, v)}
        minimumTrackTintColor={accentHex}
        maximumTrackTintColor={colors.muted}
        thumbTintColor={accentHex}
      />
      {minLabel != null || maxLabel != null ? (
        <View style={styles.minMaxRow}>
          <Text style={[styles.minMax, { color: colors.textSecondary }]}>
            {minLabel ?? String(min)}
          </Text>
          <Text style={[styles.minMax, { color: colors.textSecondary }]}>
            {maxLabel ?? String(max)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 2 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", flex: 1 },
  valueText: { fontSize: 13, lineHeight: 18 },
  slider: { width: "100%", height: 40 },
  minMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  minMax: { fontSize: 12, lineHeight: 16 },
});
