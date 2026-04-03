"use client";

import { Separator } from "@neynar/ui/separator";

export function SnapSeparator({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const orientation =
    (props.orientation as "horizontal" | "vertical") ?? "horizontal";

  return <Separator orientation={orientation} />;
}
