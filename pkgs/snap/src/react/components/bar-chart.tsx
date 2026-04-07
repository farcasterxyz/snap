"use client";

import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapBarChart({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const colors = useSnapColors();
  const bars = Array.isArray(props.bars) ? props.bars : [];
  const chartColor = props.color ? String(props.color) : undefined;
  const maxVal =
    props.max != null
      ? Number(props.max)
      : Math.max(
          ...bars.map((b: { value?: number }) => Number(b.value ?? 0)),
          1,
        );

  function barFill(bar: { color?: string }): string {
    if (bar.color) return colors.colorHex(bar.color);
    return colors.colorHex(chartColor);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {bars.map(
        (
          bar: { label?: string; value?: number; color?: string },
          i: number,
        ) => {
          const value = Number(bar.value ?? 0);
          const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
          const fill = barFill(bar);
          return (
            <div key={i} className="flex w-full items-center gap-2">
              <span
                className="w-20 shrink-0 truncate text-right text-xs"
                style={{ color: colors.textMuted }}
              >
                {String(bar.label ?? "")}
              </span>
              <div
                className="h-2.5 flex-1 overflow-hidden rounded-full"
                style={{ backgroundColor: colors.muted }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    minWidth: pct > 0 ? 4 : 0,
                    backgroundColor: fill,
                  }}
                />
              </div>
              <span
                className="w-8 shrink-0 text-xs tabular-nums"
                style={{ color: colors.textMuted }}
              >
                {value}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}
