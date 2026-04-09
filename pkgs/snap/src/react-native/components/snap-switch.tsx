import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";

export function SnapSwitch({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const name = String(props.name ?? "switch");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const fallback = Boolean(props.defaultChecked ?? false);
  const raw = get(path);
  const checked = raw === undefined || raw === null ? fallback : Boolean(raw);

  return (
    <View style={styles.row}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <Switch
        value={checked}
        onValueChange={(v) => set(path, v)}
        trackColor={{ false: colors.muted, true: accentHex }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
    flex: 1,
  },
});
