import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";
import { ICON_MAP } from "./snap-icon";

export function SnapBadge({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex, hex } = useSnapPalette();
  const label = String(props.label ?? "");
  const color = props.color ? String(props.color) : undefined;
  const iconName = props.icon ? String(props.icon) : undefined;
  const isAccent = !color || color === "accent";
  const resolvedColor = isAccent ? accentHex : hex(color);

  const Icon = iconName ? ICON_MAP[iconName] : undefined;

  return (
    <View
      style={[
        styles.badge,
        isAccent
          ? { backgroundColor: resolvedColor, borderColor: resolvedColor }
          : { borderColor: resolvedColor },
      ]}
    >
      {Icon && (
        <Icon size={10} color={isAccent ? "#fff" : resolvedColor} />
      )}
      <Text
        style={[
          styles.label,
          { color: isAccent ? "#fff" : resolvedColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
