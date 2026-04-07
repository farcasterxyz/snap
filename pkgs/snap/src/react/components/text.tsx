"use client";

import { Text } from "@neynar/ui/typography";
import { useSnapColors } from "../hooks/use-snap-colors";

const SIZE_MAP = {
  md: { textSize: "base" as const },
  sm: { textSize: "sm" as const },
} as const;

export function SnapText({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const content = String(props.content ?? "");
  const size = String(props.size ?? "md") as "md" | "sm";
  const weight = props.weight ? String(props.weight) as "bold" | "normal" : undefined;
  const align = (props.align as "left" | "center" | "right") ?? undefined;
  const config = SIZE_MAP[size] ?? SIZE_MAP.md;
  const colors = useSnapColors();

  return (
    <Text
      size={config.textSize}
      weight={weight}
      align={align}
      className="flex-1"
      style={{ color: colors.text }}
    >
      {content}
    </Text>
  );
}
