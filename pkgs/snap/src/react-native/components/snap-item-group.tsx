import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSnapTheme } from "../theme";
import { SnapItemGroupBorderProvider } from "./item-layout-context";

const GAP_MAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
};

export function SnapItemGroup({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useSnapTheme();
  const border = Boolean(props.border);
  const separator = Boolean(props.separator);
  const explicitGap =
    typeof props.gap === "string" ? String(props.gap) : undefined;
  const defaultGap = border || separator ? "sm" : "none";
  const gap = GAP_MAP[explicitGap ?? defaultGap] ?? GAP_MAP[defaultGap]!;
  const items = Children.toArray(children);

  return (
    <SnapItemGroupBorderProvider value={border}>
      <View
        style={[
          styles.group,
          border && {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
          },
          { gap },
        ]}
      >
        {items.map((child, i) => (
          <Fragment key={i}>
            {separator && i > 0 && (
              <View
                style={{ height: 1, backgroundColor: colors.border + "80" }}
              />
            )}
            {child}
          </Fragment>
        ))}
      </View>
    </SnapItemGroupBorderProvider>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
    overflow: "hidden",
  },
});
