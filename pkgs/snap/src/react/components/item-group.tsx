"use client";

import { Children, type ReactNode, Fragment } from "react";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { SnapItemGroupBorderProvider } from "./item-layout-context";

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
  const explicitGap =
    typeof props.gap === "string" ? String(props.gap) : undefined;
  const defaultGap = border || separator ? "sm" : "none";
  const gap = GAP_MAP[explicitGap ?? defaultGap] ?? GAP_MAP[defaultGap]!;
  const items = Children.toArray(children);
  const colors = useSnapColors();

  return (
    <SnapItemGroupBorderProvider value={border}>
      <div
        className={cn("flex flex-col", border && "rounded-lg border", gap)}
        style={border ? { borderColor: colors.border } : undefined}
      >
        {items.map((child, i) => (
          <Fragment key={i}>
            {separator && i > 0 && (
              <div
                className="h-px"
                style={{ backgroundColor: colors.border }}
              />
            )}
            {child}
          </Fragment>
        ))}
      </div>
    </SnapItemGroupBorderProvider>
  );
}
