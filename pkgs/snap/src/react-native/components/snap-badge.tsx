import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { ICON_MAP } from "./snap-icon";

export function SnapBadge({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex, hex } = useSnapPalette();
  const label = String(props.label ?? "");
  const variant = String(props.variant ?? "default");
  const color = props.color ? String(props.color) : undefined;
  const iconName = props.icon ? String(props.icon) : undefined;
  const isAccent = !color || color === "accent";
  const resolvedColor = isAccent ? accentHex : hex(color);
  const isFilled = variant !== "outline";

  const Icon = iconName ? ICON_MAP[iconName] : undefined;

  return (
    <View
      style={[
        styles.badge,
        isFilled
          ? { backgroundColor: resolvedColor + "20", borderColor: "transparent" }
          : { borderColor: resolvedColor },
      ]}
    >
      {Icon && (
        <Icon size={12} color={resolvedColor} />
      )}
      <Text
        style={[
          styles.label,
          { color: resolvedColor },
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
    lineHeight: 16,
    fontWeight: "500",
  },
});
