"use client";

import { useStateStore } from "@json-render/react";
import { Slider } from "@neynar/ui/slider";

export function SnapSlider({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const name = String(props.name ?? "slider");
  const path = `/inputs/${name}`;
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = props.step != null ? Number(props.step) : 1;
  const fallback = props.value != null ? Number(props.value) : (min + max) / 2;
  const raw = get(path);
  const value = raw === undefined || raw === null ? fallback : Number(raw);

  return (
    <Slider
      className="w-full"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(v) => {
        const next = Array.isArray(v) ? v[0] : v;
        if (next !== undefined) set(path, next);
      }}
    />
  );
}
