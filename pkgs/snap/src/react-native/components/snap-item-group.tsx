import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSnapTheme } from "../theme";

const GAP_MAP: Record<string, number> = { none: 0, sm: 4, md: 8, lg: 12 };

export function SnapItemGroup({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useSnapTheme();
  const border = Boolean(props.border);
  const separator = Boolean(props.separator);
  const gap = GAP_MAP[String(props.gap ?? "sm")] ?? 4;
  const items = Children.toArray(children);

  return (
    <View
      style={[
        styles.group,
        border && { borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
        { gap },
      ]}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {separator && i > 0 && (
            <View style={{ height: 1, backgroundColor: colors.border + "80" }} />
          )}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
    overflow: "hidden",
  },
});
