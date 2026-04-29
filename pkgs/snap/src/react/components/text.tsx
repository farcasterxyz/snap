"use client";

import { Text } from "@neynar/ui/typography";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { useSnapStackDirection } from "../stack-direction-context";

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
  const stackDir = useSnapStackDirection();
  const inHorizontalStack = stackDir === "horizontal";

  return (
    <Text
      size={config.textSize}
      weight={weight}
      align={align}
      className={cn(
        /** Row peers hug content like RN `wrapRow`; avoid `flex-1` stretching peers across the row. */
        inHorizontalStack ? "min-w-0 shrink" : "flex-1",
      )}
      style={{ color: colors.text }}
    >
      {content}
    </Text>
  );
}
