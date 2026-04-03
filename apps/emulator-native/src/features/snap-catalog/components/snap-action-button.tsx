import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";
import { useTheme } from "../../../ThemeContext";
import { ICON_MAP } from "./snap-icon";

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
        return { backgroundColor: "transparent", borderWidth: 1.5, borderColor: accentHex };
      case "outline":
        return { backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: colors.border };
      case "ghost":
        return { backgroundColor: "rgba(255,255,255,0.04)" };
    }
  })();

  const textColor = variant === "default" ? "#fff" : variant === "secondary" ? accentHex : colors.text;
  const iconColor = variant === "default" ? "#fff" : variant === "secondary" ? accentHex : colors.text;

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          variant === "default" ? styles.btnDefault : styles.btnOther,
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
        {iconName && ICON_MAP[iconName] ? (
          (() => { const I = ICON_MAP[iconName]!; return <I size={16} color={iconColor} />; })()
        ) : null}
        <Text style={{ color: textColor, fontSize: 14, fontWeight: "600" }}>
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
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnDefault: {
    paddingVertical: 10,
  },
  btnOther: {
    paddingVertical: 8,
  },
  pressed: { opacity: 0.88 },
});
