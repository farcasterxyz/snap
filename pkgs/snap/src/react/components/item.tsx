"use client";

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemMedia,
} from "@neynar/ui/item";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { useSnapStackDirection } from "../stack-direction-context";
import { ICON_MAP } from "./icon";

type ItemMediaConfig =
  | {
      variant: "icon";
      name: string;
      color?: string;
    }
  | {
      variant: "image";
      url: string;
      alt?: string;
    };

function parseItemMedia(value: unknown): ItemMediaConfig | undefined {
  if (!value || typeof value !== "object") return undefined;

  const media = value as Record<string, unknown>;
  if (media.variant === "icon" && typeof media.name === "string") {
    return {
      variant: "icon",
      name: media.name,
      color: typeof media.color === "string" ? media.color : undefined,
    };
  }

  if (media.variant === "image" && typeof media.url === "string") {
    return {
      variant: "image",
      url: media.url,
      alt: typeof media.alt === "string" ? media.alt : undefined,
    };
  }

  return undefined;
}

export function SnapItem({
  element: { props, children: childIds },
  children,
}: {
  element: { props: Record<string, unknown>; children?: string[] };
  children?: React.ReactNode;
}) {
  const title = String(props.title ?? "");
  const description = props.description ? String(props.description) : undefined;
  const media = parseItemMedia(props.media);
  const colors = useSnapColors();
  const inHorizontalStack = useSnapStackDirection() === "horizontal";
  const MediaIcon =
    media?.variant === "icon" ? ICON_MAP[media.name] : undefined;

  return (
    <Item
      className={cn(
        "py-1.5 px-2.5",
        /** Horizontal: share width with peers. Vertical: don't fill column height. */
        inHorizontalStack && "flex-1",
      )}
    >
      {media?.variant === "icon" && MediaIcon && (
        <ItemMedia variant="icon">
          <MediaIcon
            size={20}
            style={{ color: colors.colorHex(media.color) }}
          />
        </ItemMedia>
      )}
      {media?.variant === "image" && (
        <ItemMedia variant="image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt={media.alt ?? ""}
            className="size-full object-cover"
          />
        </ItemMedia>
      )}
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
