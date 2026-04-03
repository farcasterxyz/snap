import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../ThemeContext";

export function SnapItemGroup({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useTheme();
  const border = Boolean(props.border);
  const separator = Boolean(props.separator);
  const items = Children.toArray(children);

  return (
    <View
      style={[
        styles.group,
        border && { borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
      ]}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {separator && i > 0 && (
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
          )}
          <View style={border ? styles.itemPadded : separator ? styles.itemSepOnly : undefined}>
            {child}
          </View>
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
  sep: {
    height: 1,
    marginHorizontal: 12,
  },
  itemPadded: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemSepOnly: {
    paddingVertical: 8,
  },
});
