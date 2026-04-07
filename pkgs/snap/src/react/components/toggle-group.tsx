"use client";

import { useState } from "react";
import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapToggleGroup({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="w-full space-y-1.5">
      {label && <Label style={{ color: colors.text }}>{label}</Label>}
      <div
        className={cn(
          "flex gap-1 rounded-lg p-1",
          isVertical ? "flex-col" : "flex-row",
        )}
        style={{ backgroundColor: colors.muted }}
      >
        {options.map((opt, i) => {
          const isSelected = selected.includes(opt);
          const isHovered = hoveredIdx === i && !isSelected;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              onPointerEnter={() => setHoveredIdx(i)}
              onPointerLeave={() => setHoveredIdx(null)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isVertical ? "w-full" : "flex-1",
              )}
              style={{
                transition: "background-color 0.15s, color 0.15s",
                ...(isSelected
                  ? {
                      backgroundColor: colors.mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                      color: colors.text,
                    }
                  : {
                      color: colors.text,
                      backgroundColor: isHovered
                        ? (colors.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)")
                        : (colors.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
                    }),
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
