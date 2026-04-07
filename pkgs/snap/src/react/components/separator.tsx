"use client";

import { Separator } from "@neynar/ui/separator";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapSeparator({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const orientation =
    (props.orientation as "horizontal" | "vertical") ?? "horizontal";
  const colors = useSnapColors();

  return (
    <Separator
      orientation={orientation}
      style={{ backgroundColor: colors.border }}
    />
  );
}
