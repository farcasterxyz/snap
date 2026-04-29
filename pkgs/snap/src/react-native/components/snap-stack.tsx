import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  countRenderableChildren,
  horizontalChildrenAreAllButtons,
} from "../../stack-horizontal-utils.js";
import {
  SnapStackDirectionProvider,
  useSnapStackDirection,
} from "../stack-direction-context";

const VGAP: Record<string, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

const HGAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
};

const JUSTIFY: Record<string, "flex-start" | "center" | "flex-end" | "space-between" | "space-around"> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

/** Equal-width cells for explicit `columns` and all-button horizontal rows. */
function wrapEqualColumnCells(children: ReactNode): ReactNode {
  const cells = Children.toArray(children).filter(
    (c) => c != null && c !== false,
  );
  return cells.map((child, i) => (
    <View key={i} style={styles.equalColumnCell}>
      {child}
    </View>
  ));
}

export function SnapStack({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const parentDirection = useSnapStackDirection();
  const direction = String(props.direction ?? "vertical");
  const rawGap = props.gap;
  const isHorizontal = direction === "horizontal";
  const gapMap = isHorizontal ? HGAP : VGAP;
  const gap =
    typeof rawGap === "number"
      ? rawGap
      : typeof rawGap === "string" && rawGap in gapMap
        ? gapMap[rawGap]!
        : isHorizontal ? HGAP.md! : VGAP.md!;
  const buttonRowGrid =
    isHorizontal && horizontalChildrenAreAllButtons(children);
  const buttonRowCount = buttonRowGrid
    ? countRenderableChildren(children)
    : 0;

  const columnsRaw = props.columns;
  const columns =
    typeof columnsRaw === "number" &&
    columnsRaw >= 2 &&
    columnsRaw <= 6 &&
    Number.isInteger(columnsRaw)
      ? columnsRaw
      : undefined;
  const explicitColumnGrid =
    isHorizontal && columns !== undefined && !buttonRowGrid;

  const justify =
    props.justify &&
    (!isHorizontal || (!buttonRowGrid && !explicitColumnGrid))
      ? JUSTIFY[String(props.justify)]
      : undefined;

  const isRowChild = parentDirection === "horizontal";

  const packedHorizontal =
    isHorizontal &&
    ((buttonRowGrid &&
      buttonRowCount >= 1 &&
      buttonRowCount <= 6) ||
      explicitColumnGrid);

  let horizontalBody: ReactNode = children;
  if (
    isHorizontal &&
    buttonRowGrid &&
    buttonRowCount >= 1 &&
    buttonRowCount <= 6
  ) {
    horizontalBody = wrapEqualColumnCells(children);
  } else if (isHorizontal && explicitColumnGrid && columns !== undefined) {
    horizontalBody = wrapEqualColumnCells(children);
  }

  return (
    <SnapStackDirectionProvider
      direction={isHorizontal ? "horizontal" : "vertical"}
    >
      <View
        style={[
          isRowChild ? styles.stackRowChild : styles.stack,
          isHorizontal
            ? packedHorizontal
              ? styles.horizontalPacked
              : styles.horizontalDefault
            : styles.verticalStack,
          { gap },
          justify ? { justifyContent: justify } : undefined,
        ]}
      >
        {horizontalBody}
      </View>
    </SnapStackDirectionProvider>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: "100%",
    minWidth: 0,
  },
  verticalStack: {
    width: "100%",
    minWidth: 0,
  },
  /** Nested stack inside a horizontal row — share width with siblings (matches web flex peers). */
  stackRowChild: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  /** Default horizontal row: single line, equal-height peers. */
  horizontalDefault: {
    flexDirection: "row",
    alignItems: "stretch",
    flexWrap: "nowrap",
    width: "100%",
    minWidth: 0,
  },
  /** Single row for packed equal-width cells (button grids & explicit columns). */
  horizontalPacked: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    width: "100%",
    minWidth: 0,
  },
  equalColumnCell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
});
