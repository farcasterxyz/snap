"use client";

import { Children, type ReactNode, Fragment } from "react";
import { cn } from "@neynar/ui/utils";

export function SnapItemGroup({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const border = Boolean(props.border);
  const separator = Boolean(props.separator);
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "flex flex-col",
        border && "rounded-lg border",
      )}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {separator && i > 0 && (
            <div className="border-t mx-3" />
          )}
          <div className={cn(border && "px-3 py-2", !border && separator && "py-2")}>
            {child}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
