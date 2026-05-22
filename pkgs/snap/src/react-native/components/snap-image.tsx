import type { ComponentRenderProps } from "@json-render/react-native";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import type { ViewProps } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapStackDirection } from "../stack-direction-context";

function aspectToRatio(aspect: string): number {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return 1;
  return w / h;
}

export function SnapImage({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const url = String(props.url ?? "");
  const alt = String(props.alt ?? "");
  const title = props.title ? String(props.title) : "";
  const subtitle = props.subtitle ? String(props.subtitle) : "";
  const hasOverlay = title.length > 0 || subtitle.length > 0;
  const ratio = aspectToRatio(String(props.aspect ?? "1:1"));
  const stackDir = useSnapStackDirection();
  const inHorizontalStack = stackDir === "horizontal";
  const [frameWidth, setFrameWidth] = useState(0);
  const measuredHeight = frameWidth > 0 ? frameWidth / ratio : undefined;
  const handleLayout = useCallback<NonNullable<ViewProps["onLayout"]>>((event) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setFrameWidth((currentWidth) =>
      currentWidth !== nextWidth ? nextWidth : currentWidth,
    );
  }, []);

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.frame,
        inHorizontalStack ? styles.frameInHorizontalRow : styles.frameFullWidth,
        measuredHeight ? { height: measuredHeight } : { aspectRatio: ratio },
      ]}
    >
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel={alt || undefined}
      />
      {hasOverlay ? (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayContent}>
            {title ? (
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text numberOfLines={1} style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  frameFullWidth: {
    width: "100%",
  },
  frameInHorizontalRow: {
    flex: 1,
    minWidth: 0,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 3,
    paddingBottom: 3,
  },
  overlayContent: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textShadowColor: "#000",
    textShadowOffset: { width: 1.25, height: 1.25 },
    textShadowRadius: 1,
  },
  subtitle: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    textShadowColor: "#000",
    textShadowOffset: { width: 1.25, height: 1.25 },
    textShadowRadius: 1,
  },
});
