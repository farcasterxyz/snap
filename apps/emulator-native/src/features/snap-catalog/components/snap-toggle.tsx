import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { hexToRgba, useSnapPalette } from "../useSnapPalette";

export function SnapToggle({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const name = String(props.name ?? "toggle");
  const path = `/inputs/${name}`;
  const label = String(props.label ?? name);
  const fallback = Boolean(props.value ?? false);
  const raw = get(path);
  const checked =
    raw === undefined || raw === null ? fallback : Boolean(raw);

  const trackOn = hexToRgba(accentHex, 0.38);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={checked}
        onValueChange={(v) => set(path, v)}
        trackColor={{ false: "#e5e7eb", true: trackOn }}
        /**
         * iOS: omit `thumbColor` so UISwitch keeps the system frosted “glass” knob.
         * Setting thumbColor forces a flat thumb (RN docs). Android has no glass; use accent there.
         */
        thumbColor={
          Platform.OS === "android"
            ? checked
              ? accentHex
              : "#f3f4f6"
            : undefined
        }
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontWeight: "400",
  },
});
