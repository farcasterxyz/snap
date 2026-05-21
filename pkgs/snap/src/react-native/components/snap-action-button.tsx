declare const __DEV__: boolean;

import type { ComponentRenderProps } from "@json-render/react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import {
  getPaginatorAction,
  runPaginatorAction,
  useSnapPaginatorActions,
} from "../paginator-action-context";
import { useSnapStackDirection } from "../stack-direction-context";
import { ICON_MAP } from "./snap-icon";

function isExternalLinkAction(
  on: Record<string, unknown> | undefined,
): boolean {
  if (!on) return false;
  const press = on.press as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return false;
  return press.action === "open_url";
}

export function SnapActionButton({
  element,
  emit,
}: ComponentRenderProps<Record<string, unknown>>) {
  const { accentHex } = useSnapPalette();
  const { colors } = useSnapTheme();
  const { props } = element;
  const label = String(props.label ?? "Action");
  const variant = String(props.variant ?? "secondary");
  const isPrimary = variant === "primary";
  const iconName = props.icon ? String(props.icon) : undefined;

  const textColor = isPrimary ? "#fff" : colors.text;
  const iconColor = isPrimary ? "#fff" : colors.text;
  const inHorizontalStack = useSnapStackDirection() === "horizontal";

  const on = (element as unknown as { on?: Record<string, unknown> }).on;
  const showExternalIcon = isExternalLinkAction(on);
  const paginatorActions = useSnapPaginatorActions();
  const paginatorAction = getPaginatorAction(on);

  return (
    <View style={inHorizontalStack ? styles.outerHorizontal : styles.outer}>
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
          if (runPaginatorAction(paginatorActions, paginatorAction)) return;
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
        {iconName && ICON_MAP[iconName]
          ? (() => {
              const I = ICON_MAP[iconName]!;
              return <I size={16} color={iconColor} />;
            })()
          : null}
        <Text style={{ color: textColor, fontSize: 14, lineHeight: 18, fontWeight: "600" }}>
          {label}
        </Text>
        {showExternalIcon ? (
          <ExternalLink size={14} color={iconColor} style={{ opacity: 0.6 }} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
  },
  outerHorizontal: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    alignSelf: "stretch",
  },
  btn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnDefault: {
    paddingVertical: 8,
  },
  btnOther: {
    paddingVertical: 6,
  },
  pressed: { opacity: 0.88 },
});
