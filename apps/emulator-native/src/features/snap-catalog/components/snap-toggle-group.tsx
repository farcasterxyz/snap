import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";
import { useTheme } from "../../../ThemeContext";

export function SnapToggleGroup({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const { colors } = useTheme();
  const name = String(props.name ?? "toggle_group");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const isMultiple = Boolean(props.multiple);
  const orientation = String(props.orientation ?? "horizontal");
  const options = Array.isArray(props.options)
    ? (props.options as string[])
    : [];

  const raw = get(path);
  const defaultValue = props.defaultValue;

  const selected = (() => {
    if (raw !== undefined && raw !== null) {
      return isMultiple
        ? Array.isArray(raw)
          ? (raw as string[])
          : []
        : typeof raw === "string"
          ? [raw]
          : [];
    }
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue)
        ? (defaultValue as string[])
        : [String(defaultValue)];
    }
    return [];
  })();

  const isVertical = orientation === "vertical";

  const handlePress = (opt: string) => {
    if (isMultiple) {
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      set(path, next);
    } else {
      if (opt && opt !== selected[0]) set(path, opt);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.group,
          isVertical ? styles.groupVertical : styles.groupHorizontal,
        ]}
      >
        {options.map((opt, index) => {
          const isSelected = selected.includes(opt);
          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.option,
                { borderColor: colors.border, backgroundColor: colors.inputBg },
                isSelected && { backgroundColor: accentHex, borderColor: accentHex },
                pressed && styles.pressed,
                !isVertical && styles.optionHorizontal,
              ]}
              onPress={() => handlePress(opt)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: colors.text },
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  group: {
    gap: 4,
  },
  groupHorizontal: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  groupVertical: {
    flexDirection: "column",
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  optionHorizontal: {
    flex: 1,
  },
  pressed: { opacity: 0.88 },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#fff",
  },
});
