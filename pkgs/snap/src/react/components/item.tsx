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
import { useSnapItemGroupHasBorder } from "./item-layout-context";

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
      round?: boolean;
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
      round: typeof media.round === "boolean" ? media.round : undefined,
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
  const inBorderedGroup = useSnapItemGroupHasBorder();
  const inHorizontalStack = useSnapStackDirection() === "horizontal";
  const MediaIcon =
    media?.variant === "icon" ? ICON_MAP[media.name] : undefined;

  return (
    <Item
      className={cn(
        "gap-2 py-1.5",
        inBorderedGroup ? "px-2" : "px-0",
        /** Horizontal: share width with peers. Vertical: don't fill column height. */
        inHorizontalStack && "flex-1",
      )}
      style={{
        columnGap: 8,
        paddingInline: inBorderedGroup ? 8 : 0,
      }}
    >
      {media?.variant === "icon" && MediaIcon && (
        <ItemMedia
          variant="icon"
          className="self-center translate-y-0"
          style={{ alignSelf: "center", transform: "none" }}
        >
          <MediaIcon
            size={20}
            style={{ color: colors.colorHex(media.color) }}
          />
        </ItemMedia>
      )}
      {media?.variant === "image" && (
        <ItemMedia
          variant="image"
          className="self-center translate-y-0"
          style={{
            alignSelf: "center",
            borderRadius: media.round ? "9999px" : undefined,
            transform: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt={media.alt ?? ""}
            className="size-full object-cover"
          />
        </ItemMedia>
      )}
      <ItemContent className="gap-0">
        <ItemTitle style={{ color: colors.text }}>{title}</ItemTitle>
        {description && (
          <ItemDescription
            className="mt-0 text-xs leading-snug"
            style={{
              color: colors.textMuted,
              fontSize: 12,
              lineHeight: "16px",
            }}
          >
            {description}
          </ItemDescription>
        )}
      </ItemContent>
      {childIds && childIds.length > 0 && (
        <ItemActions
          className="gap-1.5 self-center"
          style={{ alignSelf: "center", columnGap: 6 }}
        >
          {children}
        </ItemActions>
      )}
    </Item>
  );
}
