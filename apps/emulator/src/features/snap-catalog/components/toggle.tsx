"use client";

import { useId } from "react";
import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { Switch } from "@neynar/ui/switch";

export function SnapToggle({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const id = useId();
  const { get, set } = useStateStore();
  const name = String(props.name ?? "toggle");
  const path = `/inputs/${name}`;
  const label = String(props.label ?? name);
  const fallback = Boolean(props.value ?? false);
  const raw = get(path);
  const checked = raw === undefined || raw === null ? fallback : Boolean(raw);

  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="text-foreground font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={(v) => set(path, v)} />
    </div>
  );
}
