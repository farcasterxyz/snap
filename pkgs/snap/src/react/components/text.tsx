"use client";

import { Text, Title } from "@neynar/ui/typography";

const SIZE_MAP = {
  lg: { component: "title", textSize: undefined, order: 3 },
  md: { component: "text", textSize: "base" as const, order: undefined },
  sm: { component: "text", textSize: "sm" as const, order: undefined },
} as const;

const WEIGHT_MAP = {
  bold: "bold",
  medium: "medium",
  normal: "normal",
} as const;

export function SnapText({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const content = String(props.content ?? "");
  const size = String(props.size ?? "md") as "lg" | "md" | "sm";
  const weight = props.weight ? String(props.weight) as "bold" | "medium" | "normal" : undefined;
  const align = (props.align as "left" | "center" | "right") ?? undefined;
  const config = SIZE_MAP[size] ?? SIZE_MAP.md;

  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "";

  if (config.component === "title") {
    return (
      <Title order={config.order} weight={weight ?? "bold"} className={`flex-1 ${alignClass}`}>
        {content}
      </Title>
    );
  }

  return (
    <Text size={config.textSize} weight={weight} align={align} className="flex-1">
      {content}
    </Text>
  );
}
