import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, type ReactNode, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { SnapPaginatorActionContext } from "../paginator-action-context";

function clampInitialPage(value: unknown, pageCount: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  return Math.min(Math.max(value, 0), Math.max(pageCount - 1, 0));
}

export function SnapPaginator({
  element: { props },
  children,
}: ComponentRenderProps<Record<string, unknown>> & { children?: ReactNode }) {
  const pages = useMemo(
    () => Children.toArray(children),
    [children],
  );
  const { colors } = useSnapTheme();
  const { accentHex } = useSnapPalette();
  const [page, setPage] = useState(() => clampInitialPage(props.initialPage, pages.length));
  const activePage = Math.min(page, Math.max(pages.length - 1, 0));
  const showControls = props.showControls !== false && pages.length > 1;
  const showIndicators = props.showIndicators !== false && pages.length > 1;

  if (pages.length === 0) return null;

  const canGoPrev = activePage > 0;
  const canGoNext = activePage < pages.length - 1;
  const goPrev = () => setPage((value) => Math.max(value - 1, 0));
  const goNext = () => setPage((value) => Math.min(value + 1, pages.length - 1));
  const actions = {
    previous: goPrev,
    next: goNext,
    goTo: (targetPage: number) =>
      setPage(Math.min(Math.max(targetPage, 0), pages.length - 1)),
  };

  return (
    <View style={styles.wrap}>
      <SnapPaginatorActionContext.Provider value={actions}>
        <View style={styles.page}>{pages[activePage]}</View>
      </SnapPaginatorActionContext.Provider>
      {(showControls || showIndicators) ? (
        <View style={styles.footer}>
          {showControls ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              disabled={!canGoPrev}
              onPress={goPrev}
              style={[
                styles.control,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                  opacity: canGoPrev ? 1 : 0.35,
                },
              ]}
            >
              <ChevronLeft size={15} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.controlPlaceholder} />
          )}

          {showIndicators ? (
            <View style={styles.indicators}>
              {pages.map((_, index) => (
                <Text
                  key={index}
                  accessibilityLabel={`Page ${index + 1}${index === activePage ? ", current" : ""}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activePage ? accentHex : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.indicators} />
          )}

          {showControls ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next page"
              disabled={!canGoNext}
              onPress={goNext}
              style={[
                styles.control,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                  opacity: canGoNext ? 1 : 0.35,
                },
              ]}
            >
              <ChevronRight size={15} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.controlPlaceholder} />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    minWidth: 0,
    gap: 8,
  },
  page: {
    width: "100%",
    minWidth: 0,
  },
  footer: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  control: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  controlPlaceholder: {
    width: 28,
    height: 28,
  },
  indicators: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
});
