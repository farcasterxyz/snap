import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapTheme } from "../theme";

const SIZE_STYLES: Record<string, { fontSize: number; lineHeight?: number; fontWeight?: "400" | "500" | "600" | "700" }> = {
  md: { fontSize: 16, lineHeight: 24 },
  sm: { fontSize: 13, lineHeight: 18 },
};

const WEIGHT_MAP: Record<string, "400" | "500" | "600" | "700"> = {
  bold: "700",
  normal: "400",
};

export function SnapText({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { colors } = useSnapTheme();
  const content = String(props.content ?? "");
  const size = String(props.size ?? "md");
  const weight = props.weight ? String(props.weight) : undefined;
  const align = (props.align as "left" | "center" | "right" | undefined) ?? undefined;

  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const resolvedWeight = weight ? WEIGHT_MAP[weight] : sizeStyle?.fontWeight;
  const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.base,
          {
            color: colors.text,
            fontSize: sizeStyle!.fontSize,
            lineHeight: sizeStyle!.lineHeight,
            fontWeight: resolvedWeight,
            textAlign,
          },
        ]}
      >
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  base: {},
});
