"use client";

import { Children, type ReactNode } from "react";
import { Button } from "@neynar/ui/button";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";

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
  const accentStyle = useSnapAccentScopeStyle();

  return (
    <>
      {/* Wrapper fills json-render grid/flex parents; Button base styles include shrink-0. */}
      <div className="w-full min-w-0" style={accentStyle}>
        <Button
          type="button"
          variant={styleType === "primary" ? "default" : "outline"}
          className={cn(
            "w-full",
            styleType === "primary" &&
              "hover:!bg-[var(--snap-action-primary-hover)]",
            styleType === "secondary" &&
              "hover:!bg-[var(--snap-action-outline-hover)]",
          )}
          onClick={() => emit("press")}
        >
          {label}
        </Button>
      </div>
      {/* `[]` is truthy; omit wrapper or a 2-col Group pairs each button with an empty cell. */}
      {Children.count(children) > 0 ? (
        <div className="grid w-full gap-2">{children}</div>
      ) : null}
    </>
  );
}
