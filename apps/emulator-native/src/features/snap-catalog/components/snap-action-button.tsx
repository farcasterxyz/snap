import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";
import { useTheme } from "../../../ThemeContext";

const VARIANT_MAP: Record<string, "default" | "secondary" | "outline" | "ghost"> = {
  default: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
};

export function SnapActionButton({
  element: { props },
  emit,
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useTheme();
  const label = String(props.label ?? "Action");
  const variant = VARIANT_MAP[String(props.variant ?? "default")] ?? "default";
  const iconName = props.icon ? String(props.icon) : undefined;

  const variantStyle = (() => {
    switch (variant) {
      case "default":
        return { backgroundColor: accentHex };
      case "secondary":
        return { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border };
      case "outline":
        return { backgroundColor: "transparent", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border };
      case "ghost":
        return { backgroundColor: "transparent" };
    }
  })();

  const textColor = variant === "default" ? "#fff" : colors.text;
  const iconColor = variant === "default" ? "#fff" : colors.textSecondary;

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          variantStyle,
          pressed && styles.pressed,
        ]}
        onPress={() => {
          void (async () => {
            try {
              await emit("press");
            } catch (err: unknown) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.error("[emulator-native] snap action failed", err);
              }
            }
          })();
        }}
      >
        {iconName ? (
          <Text style={{ color: iconColor, fontSize: 12 }}>
            [{iconName}]
          </Text>
        ) : null}
        <Text style={{ color: textColor, fontSize: 16, fontWeight: "600" }}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, minWidth: 0 },
  btn: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  pressed: { opacity: 0.88 },
});
