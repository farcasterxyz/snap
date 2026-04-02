import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { hexToRgba, useSnapPalette } from "../useSnapPalette";

export function SnapButtonGroup({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const name = String(props.name ?? "choice");
  const path = `/inputs/${name}`;
  const options = Array.isArray(props.options)
    ? (props.options as unknown[]).map((o) => String(o))
    : [];
  const selected = String(get(path) ?? "");
  const layout = String(props.style ?? "stack");

  const selectedBg = hexToRgba(accentHex, 0.12);

  return (
    <View
      style={[
        styles.outer,
        layout === "row" && styles.outerRow,
        layout === "grid" && styles.outerGrid,
      ]}
    >
      {options.map((opt, index) => {
        const isOn = selected === opt;
        return (
          <Pressable
            key={`${opt}-${index}`}
            onPress={() => set(path, opt)}
            style={({ pressed }) => [
              styles.option,
              layout === "row" && styles.optionRow,
              layout === "grid" && styles.optionGrid,
              isOn && {
                borderColor: accentHex,
                backgroundColor: selectedBg,
              },
              !isOn && styles.optionIdle,
              pressed && styles.optionPressed,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                isOn && { color: accentHex },
              ]}
              numberOfLines={2}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: "100%", gap: 8 },
  outerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  outerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionIdle: {
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  optionRow: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: "42%",
  },
  optionGrid: {
    width: "48%",
    flexGrow: 1,
  },
  optionPressed: { opacity: 0.92 },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
