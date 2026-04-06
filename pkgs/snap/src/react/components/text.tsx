"use client";

import { Text } from "@neynar/ui/typography";

const SIZE_MAP = {
  md: { component: "text", textSize: "base" as const },
  sm: { component: "text", textSize: "sm" as const },
} as const;

const WEIGHT_MAP = {
  bold: "bold",
  normal: "normal",
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

  return (
    <Text size={config.textSize} weight={weight} align={align} className="flex-1">
      {content}
    </Text>
  );
}
