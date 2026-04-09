import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSnapTheme } from "../theme";

export function SnapItem({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useSnapTheme();
  const title = String(props.title ?? "");
  const description = props.description
    ? String(props.description)
    : undefined;
  const variant = String(props.variant ?? "default");

  const containerVariant = { paddingVertical: 6, paddingHorizontal: 10 };

  return (
    <View style={[styles.container, containerVariant]}>
      <View style={styles.content}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  actions: {
    marginLeft: "auto",
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    flexGrow: 0,
    flexBasis: "auto",
    gap: 4,
  },
});
