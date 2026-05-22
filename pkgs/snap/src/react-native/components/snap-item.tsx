import type { ComponentRenderProps } from "@json-render/react-native";
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSnapStackDirection } from "../stack-direction-context";
import { useSnapTheme } from "../theme";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapItemGroupHasBorder } from "./item-layout-context";
import { ICON_MAP } from "./snap-icon";

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
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useSnapTheme();
  const { accentHex, hex } = useSnapPalette();
  const title = String(props.title ?? "");
  const description = props.description ? String(props.description) : undefined;
  const media = parseItemMedia(props.media);
  const inBorderedGroup = useSnapItemGroupHasBorder();
  /** Match web `Item className="flex-1"`: row peers must share width or title/description collapse. */
  const rowPeer = useSnapStackDirection() === "horizontal";
  const MediaIcon =
    media?.variant === "icon" ? ICON_MAP[media.name] : undefined;
  const mediaColor =
    media?.variant === "icon" && media.color && media.color !== "accent"
      ? hex(media.color)
      : accentHex;

  const containerVariant = {
    paddingVertical: 6,
    paddingHorizontal: inBorderedGroup ? 8 : 0,
    columnGap: 8,
  };

  return (
    <View
      style={[styles.container, containerVariant, rowPeer && styles.rowPeer]}
    >
      {media?.variant === "icon" && MediaIcon ? (
        <View style={styles.iconMedia}>
          <MediaIcon size={20} color={mediaColor} />
        </View>
      ) : null}
      {media?.variant === "image" ? (
        <View style={[styles.imageMedia, media.round && styles.roundImage]}>
          <Image
            source={{ uri: media.url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={media.alt || undefined}
          />
        </View>
      ) : null}
      <View style={styles.content}>
        {title ? (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        ) : null}
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {children ? (
        <View style={styles.actions}>
          <View style={{ flex: 0 }}>{children}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowPeer: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  iconMedia: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageMedia: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  roundImage: {
    borderRadius: 9999,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    marginLeft: "auto",
    paddingLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    flexGrow: 0,
    flexBasis: "auto",
    gap: 4,
  },
});
