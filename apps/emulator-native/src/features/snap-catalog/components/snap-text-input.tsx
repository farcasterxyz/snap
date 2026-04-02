import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import { StyleSheet, TextInput, View } from "react-native";
import { hexToRgba, useSnapPalette } from "../useSnapPalette";

export function SnapTextInput({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const name = String(props.name ?? "input");
  const path = `/inputs/${name}`;
  const value = String(get(path) ?? "");
  const placeholder =
    props.placeholder != null ? String(props.placeholder) : "";
  const maxLength =
    props.maxLength != null ? Number(props.maxLength) : undefined;

  return (
    <View style={styles.wrap}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: hexToRgba(accentHex, 0.78),
          },
        ]}
        value={value}
        onChangeText={(t) => set(path, t)}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
});
