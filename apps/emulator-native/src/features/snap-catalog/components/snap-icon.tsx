import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

const SIZE_PX: Record<string, number> = {
  sm: 16,
  md: 20,
};

/**
 * Icon placeholder for React Native. Renders the icon name as text
 * since we don't bundle lucide-react-native. A real app would use
 * an icon library here.
 */
export function SnapIcon({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex, hex } = useSnapPalette();
  const name = String(props.name ?? "info");
  const size = SIZE_PX[String(props.size ?? "md")] ?? 20;
  const color = props.color ? String(props.color) : undefined;
  const isAccent = !color || color === "accent";
  const resolvedColor = isAccent ? accentHex : hex(color);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedColor,
        },
      ]}
    >
      <Text
        style={[styles.label, { fontSize: size * 0.45, color: "#fff" }]}
        numberOfLines={1}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
  },
});
