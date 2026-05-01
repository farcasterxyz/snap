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
        /**
         * Row peers hug content like RN `wrapRow` — `min-w-0 shrink` lets text wrap
         * inside a horizontal stack without forcing peers wide. In a vertical stack
         * the `<p>` already fills its parent's width via `display: block`; avoid
         * `flex-1` here because `flex-grow: 1` on a vertical-flex child fills the
         * column's height, distributing siblings when the row is taller than its
         * content (e.g. text next to a tall image).
         */
        inHorizontalStack ? "min-w-0 shrink" : "min-w-0",
      )}
      style={{ color: colors.text }}
    >
      {content}
    </Text>
  );
}
