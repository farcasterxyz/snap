import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export function SnapGroup({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const layout = props.layout === "grid" ? "grid" : "row";

  if (layout === "grid") {
    return (
      <View style={styles.grid}>
        {Children.map(children, (child, i) => (
          <View key={i} style={styles.gridCell}>
            {child}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {Children.map(children, (child, i) => (
        <View key={i} style={styles.rowCell}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "stretch",
  },
  rowCell: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridCell: {
    flexGrow: 1,
    flexBasis: "48%",
    minWidth: "45%",
  },
});
