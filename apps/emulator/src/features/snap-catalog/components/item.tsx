"use client";

import type { ReactNode } from "react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@neynar/ui/item";

export function SnapItem({
  element: { props },
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const title = String(props.title ?? "");
  const description = props.description ? String(props.description) : undefined;
  const variant =
    (props.variant as "default" | "outline" | "muted") ?? "default";

  return (
    <Item variant={variant}>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
      {children && <ItemActions>{children}</ItemActions>}
    </Item>
  );
}
