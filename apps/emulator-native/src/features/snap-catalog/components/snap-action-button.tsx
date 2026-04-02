import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

export function SnapActionButton({
  element: { props },
  emit,
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { accentHex } = useSnapPalette();
  const label = String(props.label ?? "Action");
  const styleType = props.style === "secondary" ? "secondary" : "primary";

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styleType === "primary"
            ? { backgroundColor: accentHex }
            : styles.btnSecondary,
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
        <Text
          style={
            styleType === "primary" ? styles.btnTextPrimary : styles.btnTextSecondary
          }
        >
          {label}
        </Text>
      </Pressable>
      {Children.count(children) > 0 ? (
        <View style={styles.childStack}>{children}</View>
      ) : null}
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
  },
  btnSecondary: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d5db",
  },
  pressed: { opacity: 0.88 },
  btnTextPrimary: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnTextSecondary: { color: "#111827", fontSize: 16, fontWeight: "600" },
  childStack: { width: "100%", gap: 8, marginTop: 8 },
});
