import type { ComponentRenderProps } from "@json-render/react-native";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

export function SnapItem({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const title = String(props.title ?? "");
  const description = props.description
    ? String(props.description)
    : undefined;
  const variant = String(props.variant ?? "default");

  const containerStyle =
    variant === "outline"
      ? [styles.container, styles.containerOutline]
      : variant === "muted"
        ? [styles.container, styles.containerMuted]
        : [styles.container];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
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
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  containerOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    borderRadius: 10,
  },
  containerMuted: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  description: {
    fontSize: 13,
    color: "#6b7280",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
