"use client";

import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/use-snap-accent";

export function SnapToggleGroup({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const accentStyle = useSnapAccentScopeStyle();
  const name = String(props.name ?? "toggle_group");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const isMultiple = Boolean(props.multiple);
  const orientation = String(props.orientation ?? "horizontal");
  const options = Array.isArray(props.options)
    ? (props.options as string[])
    : [];

  const raw = get(path);
  const defaultValue = props.defaultValue;

  const selected = (() => {
    if (raw !== undefined && raw !== null) {
      return isMultiple
        ? Array.isArray(raw) ? (raw as string[]) : []
        : typeof raw === "string" ? [raw] : [];
    }
    if (defaultValue !== undefined) {
      return Array.isArray(defaultValue) ? defaultValue as string[] : [String(defaultValue)];
    }
    return [];
  })();

  const toggle = (opt: string) => {
    if (isMultiple) {
      const current = Array.isArray(raw) ? (raw as string[]) : [];
      if (current.includes(opt)) {
        set(path, current.filter((v) => v !== opt));
      } else {
        set(path, [...current, opt]);
      }
    } else {
      set(path, opt);
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <div className="w-full space-y-1.5" style={accentStyle}>
      {label && <Label>{label}</Label>}
      <div
        className={cn(
          "flex gap-1 rounded-lg bg-border/20 p-1",
          isVertical ? "flex-col" : "flex-row",
        )}
      >
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isVertical ? "w-full" : "flex-1",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-border/30",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
