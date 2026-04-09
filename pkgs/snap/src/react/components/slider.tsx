"use client";

import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapSlider({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
  const name = String(props.name ?? "slider");
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = Number(props.step ?? 1);
  const label = props.label ? String(props.label) : undefined;
  const showValue = props.showValue === true;
  const path = `/inputs/${name}`;
  const raw = get(path);
  const value =
    raw !== undefined
      ? Number(raw)
      : props.defaultValue !== undefined
        ? Number(props.defaultValue)
        : (min + max) / 2;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <Label style={{ color: colors.text }}>{label}</Label>
          {showValue && (
            <span style={{ color: colors.textMuted, fontSize: 13, lineHeight: "18px" }}>
              {Math.round(value)}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(path, Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
        style={{
          backgroundColor: colors.muted,
          accentColor: colors.accent,
        }}
      />
    </div>
  );
}
