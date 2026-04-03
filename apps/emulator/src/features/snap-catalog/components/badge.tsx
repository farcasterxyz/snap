"use client";

import { Badge } from "@neynar/ui/badge";
import { useSnapAccentScopeStyle } from "../hooks/useSnapAccent";
import { ICON_MAP } from "./icon";

export function SnapBadge({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const content = String(props.label ?? "");
  const color = props.color ? String(props.color) : undefined;
  const iconName = props.icon ? String(props.icon) : undefined;
  const accentStyle = useSnapAccentScopeStyle();

  const isAccent = !color || color === "accent";
  const Icon = iconName ? ICON_MAP[iconName] : undefined;

  return (
    <span style={isAccent ? accentStyle : undefined}>
      <Badge
        variant={isAccent ? "default" : "outline"}
        className="gap-1"
        // TODO: fix outline badge border color in @neynar/ui — too bright in dark mode
        style={
          !isAccent
            ? { borderColor: `var(--snap-color-${color})`, color: `var(--snap-color-${color})` }
            : undefined
        }
      >
        {Icon && <Icon size={12} />}
        {content}
      </Badge>
    </span>
  );
}
