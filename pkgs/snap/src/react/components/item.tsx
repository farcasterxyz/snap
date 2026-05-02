"use client";

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@neynar/ui/item";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { useSnapStackDirection } from "../stack-direction-context";

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
  const inHorizontalStack = useSnapStackDirection() === "horizontal";

  return (
    <Item
      className={cn(
        "py-1.5 px-2.5",
        /** Horizontal: share width with peers. Vertical: don't fill column height. */
        inHorizontalStack && "flex-1",
      )}
    >
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
