"use client";

import type { ReactNode } from "react";
import { Button } from "@neynar/ui/button";

export function SnapActionButton({
  element: { props },
  emit,
  children,
}: {
  element: { props: Record<string, unknown> };
  emit: (name: string) => void;
  children?: ReactNode;
}) {
  const label = String(props.label ?? "Action");
  const styleType = props.style === "secondary" ? "secondary" : "primary";

  return (
    <>
      <Button
        type="button"
        variant={styleType === "primary" ? "default" : "outline"}
        className="w-full"
        onClick={() => emit("press")}
      >
        {label}
      </Button>
      {children != null ? (
        <div className="grid w-full gap-2">{children}</div>
      ) : null}
    </>
  );
}
