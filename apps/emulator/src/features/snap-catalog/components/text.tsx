"use client";

import { Text, Title } from "@neynar/ui/typography";

export function SnapText({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const style = String(props.style ?? "body");
  const content = String(props.content ?? "");
  const align =
    (props.align as "left" | "center" | "right" | undefined) ?? "left";
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  if (style === "title") {
    return (
      <Title order={3} className={alignClass}>
        {content}
      </Title>
    );
  }

  if (style === "caption") {
    return (
      <Text size="sm" color="muted" align={align}>
        {content}
      </Text>
    );
  }

  if (style === "label") {
    return (
      <Text weight="semibold" size="sm" align={align}>
        {content}
      </Text>
    );
  }

  return (
    <Text size="base" align={align}>
      {content}
    </Text>
  );
}
