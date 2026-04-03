import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

export function SnapInput({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const name = String(props.name ?? "input");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const placeholder = props.placeholder ? String(props.placeholder) : undefined;
  const maxLength =
    typeof props.maxLength === "number" ? props.maxLength : undefined;
  const raw = get(path);
  const value = typeof raw === "string" ? raw : "";

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => set(path, text)}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 6 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151" },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#111827",
  },
});
