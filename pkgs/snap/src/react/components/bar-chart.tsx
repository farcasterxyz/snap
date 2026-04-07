"use client";

import type { PaletteColor } from "@farcaster/snap";
import { PALETTE_LIGHT_HEX } from "@farcaster/snap";
import { useSnapAccentScopeStyle } from "../hooks/use-snap-accent";

export function SnapBarChart({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const accentStyle = useSnapAccentScopeStyle();
  const bars = Array.isArray(props.bars) ? props.bars : [];
  const chartColor = String(props.color ?? "accent");
  const maxVal =
    props.max != null
      ? Number(props.max)
      : Math.max(
          ...bars.map((b: { value?: number }) => Number(b.value ?? 0)),
          1,
        );

  function barColor(bar: { color?: string }): string {
    if (bar.color && bar.color in PALETTE_LIGHT_HEX) {
      return `var(--snap-color-${bar.color}, ${PALETTE_LIGHT_HEX[bar.color as PaletteColor]})`;
    }
    if (chartColor !== "accent" && chartColor in PALETTE_LIGHT_HEX) {
      return `var(--snap-color-${chartColor}, ${PALETTE_LIGHT_HEX[chartColor as PaletteColor]})`;
    }
    return "var(--primary)";
  }

  return (
    <div className="flex w-full flex-col gap-2" style={accentStyle}>
      {bars.map(
        (
          bar: { label?: string; value?: number; color?: string },
          i: number,
        ) => {
          const value = Number(bar.value ?? 0);
          const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
          const fill = barColor(bar);
          return (
            <div key={i} className="flex w-full items-center gap-2">
              <span className="text-muted-foreground w-20 shrink-0 truncate text-right text-xs">
                {String(bar.label ?? "")}
              </span>
              <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    minWidth: pct > 0 ? 4 : 0,
                    background: fill,
                  }}
                />
              </div>
              <span className="text-muted-foreground w-8 shrink-0 text-xs tabular-nums">
                {value}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}
