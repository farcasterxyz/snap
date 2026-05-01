"use client";

import type { ReactNode } from "react";
import { cn } from "@neynar/ui/utils";
import {
  countRenderableChildren,
  defaultHorizontalGapSize,
  horizontalChildrenAreAllButtons,
} from "../../stack-horizontal-utils.js";
import {
  SnapStackDirectionProvider,
  useSnapStackDirection,
} from "../stack-direction-context";

const VGAP: Record<string, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const HGAP: Record<string, string> = {
  none: "gap-0",
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-4",
};

const JUSTIFY_FLEX: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

/** Equal columns for explicit `columns` prop and for all-button horizontal rows. */
const COLUMN_GRID_CLASS: Record<number, string> = {
  1: "grid grid-cols-1 auto-rows-auto items-stretch [&>*]:min-w-0",
  2: "grid grid-cols-2 auto-rows-auto items-stretch [&>*]:min-w-0",
  3: "grid grid-cols-3 auto-rows-auto items-stretch [&>*]:min-w-0",
  4: "grid grid-cols-4 auto-rows-auto items-stretch [&>*]:min-w-0",
  5: "grid grid-cols-5 auto-rows-auto items-stretch [&>*]:min-w-0",
  6: "grid grid-cols-6 auto-rows-auto items-stretch [&>*]:min-w-0",
};

export function SnapStack({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const parentDirection = useSnapStackDirection();
  const direction = String(props.direction ?? "vertical");
  const isHorizontal = direction === "horizontal";
  const justifyKey = props.justify ? String(props.justify) : undefined;
  const justifyFlex = justifyKey ? JUSTIFY_FLEX[justifyKey] : undefined;
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

  // Horizontal default depends on column count: 2→lg, 3→md, 4+→sm. Vertical stays md.
  // Count comes from explicit `columns`, then button-row inference, else direct children
  // count (any horizontal stack is N columns wide regardless of child types).
  const horizontalColumnCount = isHorizontal
    ? (columns ??
       (buttonRowGrid ? buttonRowCount : undefined) ??
       countRenderableChildren(children))
    : undefined;
  const explicitGap =
    typeof props.gap === "string" && props.gap in (isHorizontal ? HGAP : VGAP);
  const gapKey = explicitGap
    ? String(props.gap)
    : isHorizontal
      ? defaultHorizontalGapSize(horizontalColumnCount)
      : "md";
  const gap = isHorizontal
    ? (HGAP[gapKey] ?? HGAP.md!)
    : (VGAP[gapKey] ?? VGAP.md!);
  const explicitColumnGrid =
    isHorizontal && columns !== undefined && !buttonRowGrid;
  const columnGridClass =
    explicitColumnGrid && columns !== undefined
      ? COLUMN_GRID_CLASS[columns]
      : undefined;

  /**
   * Row peers under a horizontal stack must shrink and share width (`flex-1` + `min-w-0`).
   * Avoid `w-full` here: it resolves to 100% of the flex/grid container and fights peer sizing,
   * so each column stacks on its own wrapped row instead of sitting side-by-side.
   */
  const isRowChild = parentDirection === "horizontal";
  const rootWidthClass = isRowChild
    ? "min-w-0 flex-1 basis-0 max-w-full"
    : "w-full min-w-0";

  const justifyBlockGrid =
    justifyFlex &&
    (!isHorizontal || (!buttonRowGrid && !explicitColumnGrid));

  /** Single flex row (nowrap): peers stay side-by-side and shrink via min-w-0 / flex-1 on nested stacks. */
  const horizontalFlexClasses =
    "flex min-w-0 flex-row flex-nowrap items-stretch [&>*]:min-w-0";

  return (
    <SnapStackDirectionProvider
      direction={isHorizontal ? "horizontal" : "vertical"}
    >
      <div
        className={cn(
          rootWidthClass,
          isHorizontal
            ? buttonRowGrid &&
                buttonRowCount >= 1 &&
                buttonRowCount <= 6 &&
                COLUMN_GRID_CLASS[buttonRowCount]
              ? cn(
                  COLUMN_GRID_CLASS[buttonRowCount]!,
                  gap,
                  "[&>*]:w-full",
                )
              : explicitColumnGrid && columnGridClass
                ? cn(columnGridClass, gap)
                : cn(horizontalFlexClasses, gap, justifyBlockGrid ? justifyFlex : undefined)
            : cn("flex min-w-0 w-full flex-col", gap, justifyFlex),
        )}
      >
        {children}
      </div>
    </SnapStackDirectionProvider>
  );
}
