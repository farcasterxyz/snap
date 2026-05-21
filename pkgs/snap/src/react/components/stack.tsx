"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@neynar/ui/utils";
import {
  childrenShouldUseHorizontalButtonLayout,
  childrenAreAllButtons,
  countRenderableChildren,
  defaultHorizontalGapSize,
} from "../../stack-horizontal-utils.js";
import {
  SnapStackDirectionProvider,
  useSnapStackDirection,
} from "../stack-direction-context";

const VGAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 16,
  lg: 24,
};

const HGAP: Record<string, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
};

const JUSTIFY_FLEX: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

/** Equal-width cell count for explicit `equalWidth` / `columns` props. */
const COLUMN_GRID_CLASS: Record<number, string> = {
  1: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
  2: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
  3: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
  4: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
  5: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
  6: "auto-rows-auto items-stretch [&>*]:min-w-0 [&>*]:w-full",
};

export function SnapStack({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const parentDirection = useSnapStackDirection();
  const buttonContentUsesHorizontal =
    childrenShouldUseHorizontalButtonLayout(children);
  const direction =
    buttonContentUsesHorizontal === undefined
      ? String(props.direction ?? "vertical")
      : buttonContentUsesHorizontal
        ? "horizontal"
        : "vertical";
  const isHorizontal = direction === "horizontal";
  const justifyKey = props.justify ? String(props.justify) : undefined;
  const justifyFlex = justifyKey ? JUSTIFY_FLEX[justifyKey] : undefined;
  const allChildrenAreButtons = childrenAreAllButtons(children);

  const columnsRaw = props.columns;
  const equalWidth = props.equalWidth === true;
  const columns =
    typeof columnsRaw === "number" &&
    columnsRaw >= 2 &&
    columnsRaw <= 6 &&
    Number.isInteger(columnsRaw)
      ? columnsRaw
      : undefined;

  const equalWidthColumnCount =
    columns ?? (equalWidth ? countRenderableChildren(children) : undefined);
  const explicitEqualWidth =
    isHorizontal &&
    equalWidthColumnCount !== undefined &&
    equalWidthColumnCount >= 1 &&
    equalWidthColumnCount <= 6;

  // Button-only stacks always default to sm; mixed horizontal stacks scale by child count.
  // Vertical non-button stacks default to md.
  const horizontalChildCount = isHorizontal
    ? (explicitEqualWidth
        ? equalWidthColumnCount
        : countRenderableChildren(children))
    : undefined;
  const explicitGap =
    typeof props.gap === "string" && props.gap in (isHorizontal ? HGAP : VGAP);
  const gapKey = explicitGap
    ? String(props.gap)
    : allChildrenAreButtons
      ? "sm"
      : isHorizontal
      ? defaultHorizontalGapSize(horizontalChildCount)
      : "md";
  const gapPx = isHorizontal
    ? (HGAP[gapKey] ?? HGAP.md!)
    : (VGAP[gapKey] ?? VGAP.md!);
  const columnGridClass =
    explicitEqualWidth && equalWidthColumnCount !== undefined
      ? COLUMN_GRID_CLASS[equalWidthColumnCount]
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
    (!isHorizontal || !explicitEqualWidth);

  /** Single flex row (nowrap): peers stay side-by-side and shrink via min-w-0 / flex-1 on nested stacks. */
  const horizontalFlexClasses =
    "flex min-w-0 flex-row flex-nowrap items-stretch [&>*]:min-w-0";
  const layoutStyle: CSSProperties = {
    gap: gapPx,
    ...(explicitEqualWidth && equalWidthColumnCount !== undefined
      ? {
          display: "grid",
          gridTemplateColumns: `repeat(${equalWidthColumnCount}, minmax(0, 1fr))`,
        }
      : {}),
  };

  return (
    <SnapStackDirectionProvider
      direction={isHorizontal ? "horizontal" : "vertical"}
    >
      <div
        className={cn(
          rootWidthClass,
          isHorizontal
            ? explicitEqualWidth && columnGridClass
                ? columnGridClass
                : cn(horizontalFlexClasses, justifyBlockGrid ? justifyFlex : undefined)
            : cn("flex min-w-0 w-full flex-col", justifyFlex),
        )}
        style={layoutStyle}
      >
        {children}
      </div>
    </SnapStackDirectionProvider>
  );
}
