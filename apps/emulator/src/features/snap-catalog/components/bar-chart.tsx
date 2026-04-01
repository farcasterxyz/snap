"use client";

import { cn } from "@neynar/ui/utils";
import type { PaletteColor } from "@farcaster/snap";
import { useSnapPalette } from "../hooks/useSnapAccent";

export function SnapBarChart({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { hex, map } = useSnapPalette();
  const bars = Array.isArray(props.bars) ? props.bars : [];
  const chartColor = String(props.color ?? "accent");
  const defaultFill =
    chartColor === "accent" ? "var(--primary)" : hex(chartColor);
  const maxVal =
    props.max != null
      ? Number(props.max)
      : Math.max(
          ...bars.map((b: { value?: number }) => Number(b.value ?? 0)),
          1,
        );
  const barHeight = 120;

  return (
    <div className="w-full">
      <div
        className={cn(
          "text-muted-foreground flex w-full items-end border-b pb-px",
          bars.length > 4 ? "gap-1" : "gap-2",
        )}
        style={{ height: barHeight }}
      >
        {bars.map(
          (
            bar: { label?: string; value?: number; color?: string },
            i: number,
          ) => {
            const value = Number(bar.value ?? 0);
            const pct = maxVal > 0 ? Math.min(100, (value / maxVal) * 100) : 0;
            const fill =
              bar.color &&
              Object.prototype.hasOwnProperty.call(
                map,
                bar.color as PaletteColor,
              )
                ? hex(bar.color)
                : defaultFill;
            return (
              <div
                key={i}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div className="text-muted-foreground mb-0.5 text-[11px] font-semibold">
                  {value}
                </div>
                <div
                  className="w-full max-w-[48px] rounded-t transition-[height] duration-500 ease-out"
                  style={{
                    height: `${pct}%`,
                    minHeight: pct > 0 ? 4 : 0,
                    background: fill,
                  }}
                />
              </div>
            );
          },
        )}
      </div>
      <div
        className={cn(
          "text-muted-foreground mt-1.5 flex text-center text-[11px]",
          bars.length > 4 ? "gap-1" : "gap-2",
        )}
      >
        {bars.map((bar: { label?: string }, i: number) => (
          <div key={i} className="min-w-0 flex-1 truncate">
            {String(bar.label ?? "")}
          </div>
        ))}
      </div>
    </div>
  );
}
