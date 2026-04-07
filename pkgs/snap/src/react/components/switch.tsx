"use client";

import { useId } from "react";
import { useStateStore } from "@json-render/react";
import { Switch } from "@neynar/ui/switch";
import { Label } from "@neynar/ui/label";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapSwitch({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
  const name = String(props.name ?? "switch");
  const label = props.label ? String(props.label) : undefined;
  const path = `/inputs/${name}`;
  const raw = get(path);
  const checked =
    raw !== undefined ? Boolean(raw) : Boolean(props.defaultChecked);
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      {label && (
        <Label htmlFor={id} className="font-normal" style={{ color: colors.text }}>
          {label}
        </Label>
      )}
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={(v) => set(path, v)}
        style={{
          backgroundColor: checked ? colors.accent : colors.muted,
          borderColor: checked ? colors.accent : colors.inputBorder,
        }}
      />
    </div>
  );
}
