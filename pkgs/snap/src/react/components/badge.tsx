"use client";

import { Badge } from "@neynar/ui/badge";
import { useSnapColors, pickForegroundForBg } from "../hooks/use-snap-colors";
import { ICON_MAP } from "./icon";

export function SnapBadge({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const content = String(props.label ?? "");
  const variant = String(props.variant ?? "default") as "default" | "outline";
  const color = props.color ? String(props.color) : undefined;
  const iconName = props.icon ? String(props.icon) : undefined;
  const colors = useSnapColors();

  const badgeColor = colors.colorHex(color);
  const badgeFg = variant === "default" ? pickForegroundForBg(badgeColor) : badgeColor;

  const Icon = iconName ? ICON_MAP[iconName] : undefined;

  const style =
    variant === "outline"
      ? { borderColor: badgeColor, color: badgeColor, backgroundColor: "transparent" }
      : { backgroundColor: badgeColor, color: badgeFg, borderColor: "transparent" };

  return (
    <Badge variant={variant} className="gap-1" style={style}>
      {Icon && <Icon size={12} />}
      {content}
    </Badge>
  );
}
