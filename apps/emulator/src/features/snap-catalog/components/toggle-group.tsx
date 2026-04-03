"use client";

import { useStateStore } from "@json-render/react";
import { ToggleGroup, ToggleGroupItem } from "@neynar/ui/toggle-group";
import { Label } from "@neynar/ui/label";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

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

  return (
    <div className="w-full space-y-1.5" style={accentStyle}>
      {label && <Label>{label}</Label>}
      <ToggleGroup
        multiple={isMultiple}
        value={selected}
        onValueChange={(v) => {
          if (isMultiple) {
            set(path, v);
          } else {
            const next = v[0];
            if (typeof next === "string" && next) set(path, next);
          }
        }}
        orientation={orientation === "vertical" ? "vertical" : "horizontal"}
        variant="outline"
        spacing={8}
        className={cn(
          "flex w-full items-stretch",
          orientation === "vertical" ? "flex-col" : "flex-row",
        )}
      >
        {options.map((opt, index) => (
          <ToggleGroupItem
            key={index}
            value={opt}
            className={cn(
              "justify-center px-3 py-2.5 hover:!bg-[var(--snap-action-outline-hover)] aria-pressed:!bg-primary aria-pressed:!text-primary-foreground hover:aria-pressed:!bg-primary/90",
              orientation !== "vertical" && "flex-1",
            )}
          >
            {opt}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
