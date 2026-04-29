import type { ComponentRenderProps } from "@json-render/react-native";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
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
});
