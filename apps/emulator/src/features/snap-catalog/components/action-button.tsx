"use client";

import { Button } from "@neynar/ui/button";
import { cn } from "@neynar/ui/utils";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";
import { ICON_MAP } from "./icon";

const VARIANT_MAP: Record<string, "default" | "outline" | "ghost" | "secondary"> = {
  default: "default",
  secondary: "secondary",
  outline: "outline",
  ghost: "ghost",
};

export function SnapActionButton({
  element: { props },
  emit,
}: {
  element: { props: Record<string, unknown> };
  emit: (name: string) => void;
}) {
  const label = String(props.label ?? "Action");
  const variant = VARIANT_MAP[String(props.variant ?? "default")] ?? "default";
  const iconName = props.icon ? String(props.icon) : undefined;
  const accentStyle = useSnapAccentScopeStyle();

  const Icon = iconName ? ICON_MAP[iconName] : undefined;

  return (
    <div className="w-full min-w-0 flex-1" style={accentStyle}>
      <Button
        type="button"
        variant={variant}
        className={cn(
          "w-full gap-2",
          variant === "default" &&
            "hover:!bg-[var(--snap-action-primary-hover)]",
          variant !== "default" &&
            "hover:!bg-[var(--snap-action-outline-hover)]",
        )}
        onClick={() => emit("press")}
      >
        {Icon && <Icon size={16} />}
        {label}
      </Button>
    </div>
  );
}
