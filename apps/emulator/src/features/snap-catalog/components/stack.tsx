"use client";

import type { ReactNode } from "react";
import { cn } from "@neynar/ui/utils";

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
  lg: "gap-3",
};

export function SnapStack({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const direction = String(props.direction ?? "vertical");
  const gapKey = String(props.gap ?? "md");
  const isHorizontal = direction === "horizontal";
  const gap = isHorizontal
    ? (HGAP[gapKey] ?? "gap-2")
    : (VGAP[gapKey] ?? "gap-4");

  return (
    <div
      className={cn(
        "flex w-full",
        isHorizontal ? "flex-row items-center [&>*]:flex-1 [&>*]:min-w-0" : "flex-col",
        gap,
      )}
    >
      {children}
    </div>
  );
}
