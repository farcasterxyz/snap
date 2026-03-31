"use client";

import { useStateStore } from "@json-render/react";
import { ToggleGroup, ToggleGroupItem } from "@neynar/ui/toggle-group";

export function SnapButtonGroup({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const name = String(props.name ?? "choice");
  const path = `/inputs/${name}`;
  const options = Array.isArray(props.options) ? props.options : [];
  const selected = String(get(path) ?? "");

  return (
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
          className="w-full justify-center px-3 py-2.5"
        >
          {String(opt)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
