"use client";

import { useId } from "react";
import { useStateStore } from "@json-render/react";
import { Input } from "@neynar/ui/input";
import { Label } from "@neynar/ui/label";

export function SnapInput({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const id = useId();
  const { get, set } = useStateStore();
  const name = String(props.name ?? "input");
  const path = `/inputs/${name}`;
  const label = props.label ? String(props.label) : undefined;
  const placeholder = props.placeholder ? String(props.placeholder) : undefined;
  const maxLength =
    typeof props.maxLength === "number" ? props.maxLength : undefined;
  const raw = get(path);
  const value = typeof raw === "string" ? raw : "";

  return (
    <div className="w-full space-y-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        value={value}
        onChange={(e) => set(path, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}
