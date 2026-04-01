"use client";

import { useStateStore } from "@json-render/react";
import { ToggleGroup, ToggleGroupItem } from "@neynar/ui/toggle-group";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

export function SnapButtonGroup({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const accentStyle = useSnapAccentScopeStyle();
  const name = String(props.name ?? "choice");
  const path = `/inputs/${name}`;
  const options = Array.isArray(props.options) ? props.options : [];
  const selected = String(get(path) ?? "");

  return (
    <div className="w-full" style={accentStyle}>
      <ToggleGroup
        multiple={false}
        value={selected ? [selected] : []}
        onValueChange={(v) => {
          const next = v[0];
          if (typeof next === "string" && next) set(path, next);
        }}
        orientation="vertical"
        variant="outline"
        spacing={8}
        className="flex w-full flex-col items-stretch"
      >
        {options.map((opt: string, index: number) => (
          <ToggleGroupItem
            key={index}
            value={String(opt)}
            className={cn(
              "w-full justify-center px-3 py-2.5 hover:!bg-[var(--snap-action-outline-hover)] aria-pressed:!bg-primary aria-pressed:!text-primary-foreground hover:aria-pressed:!bg-primary/90",
            )}
          >
            {String(opt)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
