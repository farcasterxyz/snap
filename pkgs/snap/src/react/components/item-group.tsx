"use client";

import { Children, type ReactNode, Fragment } from "react";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";

const GAP_MAP: Record<string, string> = {
  none: "gap-0",
  sm: "gap-1",
  md: "gap-2",
  lg: "gap-3",
};

export function SnapItemGroup({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const border = Boolean(props.border);
  const separator = Boolean(props.separator);
  const gap = GAP_MAP[String(props.gap ?? "sm")] ?? "gap-1";
  const items = Children.toArray(children);
  const colors = useSnapColors();

  return (
    <div
      className={cn(
        "flex flex-col",
        border && "rounded-lg border",
        gap,
      )}
      style={border ? { borderColor: colors.border } : undefined}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {separator && i > 0 && (
            <div className="h-px" style={{ backgroundColor: colors.border }} />
          )}
          {child}
        </Fragment>
      ))}
    </div>
  );
}
