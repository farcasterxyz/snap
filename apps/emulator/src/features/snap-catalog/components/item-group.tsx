"use client";

import { Children, type ReactNode, Fragment } from "react";
import { cn } from "@neynar/ui/utils";

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
  const gap = GAP_MAP[String(props.gap ?? "none")] ?? "gap-0";
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "flex flex-col",
        border && "rounded-lg border",
        !separator && gap,
      )}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {separator && i > 0 && (
            <div className="h-px bg-border mx-3" />
          )}
          <div className={cn(
            (border || separator) && "px-3 py-2.5",
          )}>
            {child}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
