"use client";

import { useStateStore } from "@json-render/react";
import { Slider } from "@neynar/ui/slider";
import { useColorMode } from "@neynar/ui/color-mode";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

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
  const fallback = props.defaultValue != null ? Number(props.defaultValue) : (min + max) / 2;
  const raw = get(path);
  const value = raw === undefined || raw === null ? fallback : Number(raw);

  const sliderClassName = cn(
    "w-full [&_[data-slot=slider-track][data-orientation=horizontal]]:!h-2.5 [&_[data-slot=slider-track][data-orientation=horizontal]]:!min-w-0 [&_[data-slot=slider-track][data-orientation=horizontal]]:!w-full [&_[data-slot=slider-track][data-orientation=horizontal]]:!flex-1 [&_[data-slot=slider-track][data-orientation=vertical]]:!h-full [&_[data-slot=slider-track][data-orientation=vertical]]:!w-2.5 [&_[data-slot=slider-range][data-orientation=horizontal]]:!h-full [&_[data-slot=slider-range][data-orientation=vertical]]:!w-full",
    /* purple-dawn light `--muted` is purple-tinted; use neutral chrome grays for the rail */
    mode === "light" &&
      "[&_[data-slot=slider-track]]:!bg-[var(--border)]",
  );

  return (
    <div className="w-full" style={accentStyle}>
      <Slider
        className={sliderClassName}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = Array.isArray(v) ? v[0] : v;
          if (next !== undefined) set(path, next);
        }}
      />
    </div>
  );
}
