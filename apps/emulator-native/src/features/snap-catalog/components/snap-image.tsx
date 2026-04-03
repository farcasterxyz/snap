import type { ComponentRenderProps } from "@json-render/react-native";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

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

  return (
    <View style={[styles.frame, { aspectRatio: ratio }]}>
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
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
});
