import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

export function SnapBadge({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex, hex } = useSnapPalette();
  const label = String(props.label ?? "");
  const color = props.color ? String(props.color) : undefined;
  const iconName = props.icon ? String(props.icon) : undefined;
  const isAccent = !color || color === "accent";
  const resolvedColor = isAccent ? accentHex : hex(color);

  return (
    <View
      style={[
        styles.badge,
        isAccent
          ? { backgroundColor: resolvedColor, borderColor: resolvedColor }
          : { borderColor: resolvedColor },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isAccent ? "#fff" : resolvedColor },
        ]}
      >
        {iconName ? `[${iconName}] ` : ""}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
  },
});
