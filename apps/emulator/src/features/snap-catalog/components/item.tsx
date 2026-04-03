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
    <Item variant={variant} className="py-1.5 px-2.5 border-border/50">
      <ItemContent className="gap-0.5">
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription className="mt-0">{description}</ItemDescription>}
      </ItemContent>
      {children && <ItemActions>{children}</ItemActions>}
    </Item>
  );
}
