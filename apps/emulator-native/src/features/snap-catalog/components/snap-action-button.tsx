import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

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
  const label = String(props.label ?? "Action");
  const variant = VARIANT_MAP[String(props.variant ?? "default")] ?? "default";
  const iconName = props.icon ? String(props.icon) : undefined;

  const isPrimary = variant === "default";
  const isGhost = variant === "ghost";

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          isPrimary
            ? { backgroundColor: accentHex }
            : isGhost
              ? styles.btnGhost
              : styles.btnOutline,
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
          <Text
            style={isPrimary ? styles.iconTextPrimary : styles.iconTextSecondary}
          >
            [{iconName}]
          </Text>
        ) : null}
        <Text
          style={isPrimary ? styles.btnTextPrimary : styles.btnTextSecondary}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { width: "100%", minWidth: 0 },
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
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  pressed: { opacity: 0.88 },
  btnTextPrimary: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnTextSecondary: { color: "#111827", fontSize: 16, fontWeight: "600" },
  iconTextPrimary: { color: "#fff", fontSize: 12 },
  iconTextSecondary: { color: "#6b7280", fontSize: 12 },
});
