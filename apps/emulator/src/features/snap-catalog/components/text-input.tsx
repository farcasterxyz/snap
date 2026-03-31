"use client";

import { useStateStore } from "@json-render/react";
import { Input } from "@neynar/ui/input";

export function SnapTextInput({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const name = String(props.name ?? "input");
  const path = `/inputs/${name}`;
  const value = String(get(path) ?? "");
  const placeholder =
    props.placeholder != null ? String(props.placeholder) : "";

  return (
    <Input
      className="w-full"
      value={value}
      onChange={(e) => set(path, e.target.value)}
      placeholder={placeholder}
      maxLength={props.maxLength != null ? Number(props.maxLength) : undefined}
    />
  );
}
