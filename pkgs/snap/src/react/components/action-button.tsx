"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@neynar/ui/button";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { ICON_MAP } from "./icon";

function isExternalLinkAction(
  on: Record<string, unknown> | undefined,
): boolean {
  if (!on) return false;
  const press = on.press as
    | { action?: string; params?: Record<string, unknown> }
    | undefined;
  if (!press) return false;
  return press.action === "open_url";
}

export function SnapActionButton({
  element,
  emit,
}: {
  element: {
    props: Record<string, unknown>;
    on?: Record<string, unknown>;
  };
  emit: (name: string) => void;
}) {
  const { props } = element;
  const label = String(props.label ?? "Action");
  const variant = String(props.variant ?? "secondary");
  const isPrimary = variant === "primary";
  const iconName = props.icon ? String(props.icon) : undefined;
  const colors = useSnapColors();
  const [hovered, setHovered] = useState(false);

  const Icon = iconName ? ICON_MAP[iconName] : undefined;
  const showExternalIcon = isExternalLinkAction(element.on);

  const style = isPrimary
    ? {
        backgroundColor: hovered ? colors.accentHover : colors.accent,
        color: colors.accentFg,
        borderColor: "transparent",
      }
    : {
        backgroundColor: hovered
          ? `color-mix(in srgb, ${colors.accent} 15%, transparent)`
          : colors.muted,
        color: colors.text,
        borderColor: "transparent",
      };

  return (
    <div className="w-full min-w-0 flex-1">
      <Button
        type="button"
        variant={isPrimary ? "default" : "secondary"}
        className={cn("w-full gap-2")}
        style={style}
        onClick={() => emit("press")}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {Icon && <Icon size={16} />}
        {label}
        {showExternalIcon && (
          <ExternalLink size={14} style={{ opacity: 0.6 }} />
        )}
      </Button>
    </div>
  );
}
