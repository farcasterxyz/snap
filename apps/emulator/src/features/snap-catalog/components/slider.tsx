"use client";

import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

// TODO: switch back to @neynar/ui/slider once Base UI fixes the inline
// <script> tag that triggers a React console warning on client render.

export function SnapSlider({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const accentStyle = useSnapAccentScopeStyle();

  const name = String(props.name ?? "slider");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const step = props.step != null ? Number(props.step) : 1;
  const fallback = props.defaultValue != null ? Number(props.defaultValue) : (min + max) / 2;
  const raw = get(path);
  const value = raw === undefined || raw === null ? fallback : Number(raw);

  return (
    <div className="flex w-full flex-col gap-1.5" style={accentStyle}>
      {label && <Label>{label}</Label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(path, Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none bg-muted cursor-pointer"
        style={{ accentColor: "var(--primary)" }}
      />
    </div>
  );
}
