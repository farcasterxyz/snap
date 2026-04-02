"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { useStateStore } from "@json-render/react";
import { useColorMode } from "@neynar/ui/color-mode";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

/**
 * Base UI `thumbAlignment="edge"` injects a &lt;script&gt; for SSR prehydration; React 19
 * warns/errors on script tags in client components. Use `edge-client-only` for the same
 * layout without that script (see Base UI Slider docs).
 */
export function SnapSlider({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const { mode } = useColorMode();
  const accentStyle = useSnapAccentScopeStyle();

  const name = String(props.name ?? "slider");
  const path = `/inputs/${name}`;
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = props.step != null ? Number(props.step) : 1;
  const fallback = props.value != null ? Number(props.value) : (min + max) / 2;
  const raw = get(path);
  const value = raw === undefined || raw === null ? fallback : Number(raw);

  const sliderClassName = cn(
    "w-full [&_[data-slot=slider-track][data-orientation=horizontal]]:!h-2.5 [&_[data-slot=slider-track][data-orientation=horizontal]]:!min-w-0 [&_[data-slot=slider-track][data-orientation=horizontal]]:!w-full [&_[data-slot=slider-track][data-orientation=horizontal]]:!flex-1 [&_[data-slot=slider-track][data-orientation=vertical]]:!h-full [&_[data-slot=slider-track][data-orientation=vertical]]:!w-2.5 [&_[data-slot=slider-range][data-orientation=horizontal]]:!h-full [&_[data-slot=slider-range][data-orientation=vertical]]:!w-full",
    /* purple-dawn light `--muted` is purple-tinted; use neutral chrome grays for the rail */
    mode === "light" &&
      "[&_[data-slot=slider-track]]:!bg-[var(--border)]",
  );

  const _values = [value];

  return (
    <div className="w-full" style={accentStyle}>
      <SliderPrimitive.Root
        className="data-horizontal:w-full data-vertical:h-full"
        data-slot="slider"
        min={min}
        max={max}
        step={step}
        thumbAlignment="edge-client-only"
        value={[value]}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (next !== undefined) set(path, next);
        }}
      >
        <SliderPrimitive.Control
          className={cn(
            "data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col",
            sliderClassName,
          )}
        >
          <SliderPrimitive.Track
            data-slot="slider-track"
            className="bg-muted rounded-full data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5 relative overflow-hidden select-none"
          >
            <SliderPrimitive.Indicator
              data-slot="slider-range"
              className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
            />
          </SliderPrimitive.Track>
          {Array.from({ length: _values.length }, (_, index) => (
            <SliderPrimitive.Thumb
              data-slot="slider-thumb"
              key={index}
              className="border-primary ring-ring/50 size-4 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50"
            />
          ))}
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </div>
  );
}
