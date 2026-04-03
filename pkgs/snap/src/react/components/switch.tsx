"use client";

import { useId } from "react";
import { useStateStore } from "@json-render/react";
import { Label } from "@neynar/ui/label";
import { Switch } from "@neynar/ui/switch";
import { useColorMode } from "@neynar/ui/color-mode";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/use-snap-accent";

export function SnapSwitch({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const id = useId();
  const { get, set } = useStateStore();
  const { mode } = useColorMode();
  const accentStyle = useSnapAccentScopeStyle();
  const name = String(props.name ?? "switch");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const fallback = Boolean(props.defaultChecked ?? false);
  const raw = get(path);
  const checked = raw === undefined || raw === null ? fallback : Boolean(raw);

  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <Label htmlFor={id} className="text-foreground font-normal">
          {label}
        </Label>
      )}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(v) => set(path, v)}
        style={accentStyle}
        className={cn(
          mode === "light" &&
            "data-unchecked:!bg-border data-unchecked:!border-(--input-border)",
        )}
      />
    </div>
  );
}
