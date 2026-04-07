"use client";

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@neynar/ui/item";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapItem({
  element: { props, children: childIds },
  children,
}: {
  element: { props: Record<string, unknown>; children?: string[] };
  children?: React.ReactNode;
}) {
  const title = String(props.title ?? "");
  const description = props.description ? String(props.description) : undefined;
  const colors = useSnapColors();

  return (
    <Item className="flex-1 py-1.5 px-2.5">
      <ItemContent className="gap-0.5">
        <ItemTitle style={{ color: colors.text }}>{title}</ItemTitle>
        {description && (
          <ItemDescription className="mt-0" style={{ color: colors.textMuted }}>
            {description}
          </ItemDescription>
        )}
      </ItemContent>
      {childIds && childIds.length > 0 && <ItemActions>{children}</ItemActions>}
    </Item>
  );
}
