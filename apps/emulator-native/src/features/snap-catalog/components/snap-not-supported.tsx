import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";

export function SnapNotSupported({
  element,
}: ComponentRenderProps<Record<string, unknown>>) {
  return (
    <View style={styles.box}>
      <Text style={styles.caption}>
        Not shown in native preview yet ({element.type})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  caption: { fontSize: 13, color: "#9ca3af" },
});
