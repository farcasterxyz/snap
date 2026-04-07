declare const __DEV__: boolean;

import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { ICON_MAP } from "./snap-icon";

export function SnapActionButton({
  element: { props },
  emit,
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const label = String(props.label ?? "Action");
  const variant = String(props.variant ?? "secondary");
  const isPrimary = variant === "primary";
  const iconName = props.icon ? String(props.icon) : undefined;

  const textColor = isPrimary ? "#fff" : colors.text;
  const iconColor = isPrimary ? "#fff" : colors.text;

  return (
    <View style={styles.outer}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          isPrimary ? styles.btnDefault : styles.btnOther,
          isPrimary
            ? { backgroundColor: pressed ? accentHex + "DD" : accentHex }
            : { backgroundColor: pressed ? colors.mutedHover : colors.muted },
          pressed && styles.pressed,
        ]}
        onPress={() => {
          void (async () => {
            try {
              await emit("press");
            } catch (err: unknown) {
              if (typeof __DEV__ !== "undefined" && __DEV__) {
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
