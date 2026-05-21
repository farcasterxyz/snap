import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View } from "react-native";
import { useSnapStackDirection } from "../stack-direction-context";
import { useSnapVersion } from "../snap-version-context";
import { useSnapTheme } from "../theme";

const SIZE_STYLES: Record<string, { fontSize: number; lineHeight?: number; fontWeight?: "400" | "500" | "600" | "700" }> = {
  md: { fontSize: 16, lineHeight: 22 },
  sm: { fontSize: 13, lineHeight: 16 },
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
  const snapVersion = useSnapVersion();

  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const resolvedWeight = weight ? WEIGHT_MAP[weight] : sizeStyle?.fontWeight;
  const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  const inHorizontalStack = useSnapStackDirection() === "horizontal";
  const maxLines =
    typeof props.maxLines === "number"
      ? props.maxLines
      : snapVersion === "2.0"
        ? 1
        : undefined;

  return (
    <View style={inHorizontalStack ? styles.wrapRow : styles.wrapCol}>
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
        numberOfLines={maxLines}
      >
        {content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Full width for vertical stacks (alignment / wrapping). */
  wrapCol: { width: "100%" },
  /** Row peers: hug content; avoid width 100% fighting nowrap horizontal rows. */
  wrapRow: { flexShrink: 1, minWidth: 0 },
  base: {},
});
