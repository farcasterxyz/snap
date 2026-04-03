"use client";

import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

export function SnapProgress({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const accentStyle = useSnapAccentScopeStyle();
  const value = Number(props.value ?? 0);
  const max = Math.max(1, Number(props.max ?? 100));
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const label = props.label ? String(props.label) : null;

  return (
    <div className="flex w-full flex-col gap-1" style={accentStyle}>
      {label && (
        <span className="text-muted-foreground text-xs">{label}</span>
      )}
      <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
