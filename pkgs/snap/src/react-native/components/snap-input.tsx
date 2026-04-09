import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSnapTheme } from "../theme";

export function SnapInput({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { colors } = useSnapTheme();
  const name = String(props.name ?? "input");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const placeholder = props.placeholder ? String(props.placeholder) : undefined;
  const type = String(props.type ?? "text");
  const maxLength =
    typeof props.maxLength === "number" ? props.maxLength : undefined;
  const defaultValue = props.defaultValue != null ? String(props.defaultValue) : "";
  const raw = get(path);
  const value = raw !== undefined && raw !== null ? String(raw) : defaultValue;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.inputBg,
            color: colors.text,
          },
        ]}
        value={value}
        onChangeText={(text) => set(path, type === "number" ? Number(text) || 0 : text)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={type === "number" ? "numeric" : "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 4 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
  },
});
