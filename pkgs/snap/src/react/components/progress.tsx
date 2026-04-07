"use client";

import { useSnapColors } from "../hooks/use-snap-colors";

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

  return (
    <div className="flex w-full flex-1 flex-col gap-1">
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
