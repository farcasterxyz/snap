import type { ComponentRenderProps } from "@json-render/react-native";
import { Children, type ReactNode, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { useSnapPaginatorActions } from "../paginator-action-context";

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
  const { colors, mode } = useSnapTheme();
  const { accentHex } = useSnapPalette();
  const paginatorActions = useSnapPaginatorActions();
  const [page, setPage] = useState(() => clampInitialPage(props.initialPage, pages.length));
  const activePage = Math.min(page, Math.max(pages.length - 1, 0));
  const showControls = props.showControls !== false && pages.length > 1;
  const showIndicators = props.showIndicators !== false && pages.length > 1;

  const canGoPrev = activePage > 0;
  const canGoNext = activePage < pages.length - 1;
  const goPrev = () => setPage((value) => Math.max(value - 1, 0));
  const goNext = () => setPage((value) => Math.min(value + 1, pages.length - 1));
  const actions = useMemo(() => ({
    previous: goPrev,
    next: goNext,
    goTo: (targetPage: number) =>
      setPage(Math.min(Math.max(targetPage, 0), pages.length - 1)),
  }), [pages.length]);

  useEffect(() => {
    if (pages.length === 0) return;
    return paginatorActions?.register(actions);
  }, [actions, pages.length, paginatorActions]);

  if (pages.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.page}>{pages[activePage]}</View>
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
              {pages.map((_, index) => {
                const current = index === activePage;
                return (
                  <View
                    key={index}
                    accessibilityLabel={`Page ${index + 1}${current ? ", current" : ""}`}
                    style={[
                      styles.dot,
                      current ? styles.dotCurrent : styles.dotInactive,
                      {
                        backgroundColor: current
                          ? accentHex
                          : mode === "dark"
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(0,0,0,0.28)",
                        borderColor: current
                          ? mode === "dark"
                            ? "rgba(255,255,255,0.18)"
                            : "rgba(0,0,0,0.12)"
                          : "transparent",
                      },
                    ]}
                  />
                );
              })}
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
    borderWidth: 0,
    overflow: "hidden",
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
