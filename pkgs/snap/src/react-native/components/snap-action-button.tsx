declare const __DEV__: boolean;

import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { ICON_MAP } from "./snap-icon";

const VARIANT_MAP: Record<string, "primary" | "secondary"> = {
  primary: "primary",
  secondary: "secondary",
};

export function SnapActionButton({
  element: { props },
  emit,
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const label = String(props.label ?? "Action");
  const variant = VARIANT_MAP[String(props.variant ?? "secondary")] ?? "secondary";
  const iconName = props.icon ? String(props.icon) : undefined;

  const variantStyle = (() => {
    switch (variant) {
      case "primary":
        return { backgroundColor: accentHex };
      case "secondary":
        return { backgroundColor: "transparent", borderWidth: 1.5, borderColor: accentHex };
    }
  })();

  const textColor = variant === "primary" ? "#fff" : accentHex;
  const iconColor = variant === "primary" ? "#fff" : accentHex;

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          variant === "primary" ? styles.btnDefault : styles.btnOther,
          variantStyle,
          pressed && styles.pressed,
        ]}
        onPress={() => {
          void (async () => {
            try {
              await emit("press");
            } catch (err: unknown) {
              if (typeof __DEV__ !== "undefined" && __DEV__) {
                // eslint-disable-next-line no-console
                console.error("[snap] action failed", err);
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
