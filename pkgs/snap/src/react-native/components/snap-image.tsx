import type { ComponentRenderProps } from "@json-render/react-native";
import { Image } from "expo-image";
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

  return (
    <View
      style={[
        styles.frame,
        inHorizontalStack ? styles.frameInHorizontalRow : styles.frameFullWidth,
        { aspectRatio: ratio },
      ]}
    >
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessibilityLabel={alt || undefined}
      />
      {hasOverlay ? (
        <View style={styles.overlay}>
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
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
});
