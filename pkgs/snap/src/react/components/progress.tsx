"use client";

import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { useSnapStackDirection } from "../stack-direction-context";

export function SnapProgress({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const colors = useSnapColors();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const label = props.label ? String(props.label) : null;
  const inHorizontalStack = useSnapStackDirection() === "horizontal";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        /** Horizontal: share width with peers. Vertical: don't fill column height. */
        inHorizontalStack && "flex-1",
      )}
    >
      {label && (
        <span className="text-xs" style={{ color: colors.textMuted }}>
          {label}
        </span>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: colors.muted }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: colors.accent }}
        />
      </div>
    </div>
  );
}
