import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../ThemeContext";

export function SnapItem({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const { colors } = useTheme();
  const title = String(props.title ?? "");
  const description = props.description
    ? String(props.description)
    : undefined;
  const variant = String(props.variant ?? "default");

  const containerVariant =
    variant === "outline"
      ? { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10 }
      : variant === "muted"
        ? { backgroundColor: colors.muted, borderRadius: 8, padding: 10 }
        : { paddingVertical: 6, paddingHorizontal: 4 };

  return (
    <View style={[styles.container, containerVariant]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
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
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    marginTop: 1,
  },
  actions: {
    marginLeft: "auto",
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
