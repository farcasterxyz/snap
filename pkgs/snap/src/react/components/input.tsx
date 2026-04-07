"use client";

import { useId } from "react";
import { useStateStore } from "@json-render/react";
import { Input } from "@neynar/ui/input";
import { Label } from "@neynar/ui/label";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapInput({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
  const name = String(props.name ?? "input");
  const type = String(props.type ?? "text");
  const label = props.label ? String(props.label) : undefined;
  const placeholder = props.placeholder ? String(props.placeholder) : undefined;
  const maxLength = props.maxLength ? Number(props.maxLength) : undefined;
  const path = `/inputs/${name}`;
  const value = (get(path) as string) ?? (props.defaultValue != null ? String(props.defaultValue) : "");
  const id = useId();

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <Label htmlFor={id} style={{ color: colors.text }}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        type={type === "number" ? "number" : "text"}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(e) => set(path, e.target.value)}
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      />
    </div>
  );
}
