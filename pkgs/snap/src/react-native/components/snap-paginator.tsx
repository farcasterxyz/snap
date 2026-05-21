import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import {
  Children,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import {
  clampPaginatorPage,
  pageFromValue,
  SNAP_PAGINATOR_PAGE_COUNT_PATH,
  SNAP_PAGINATOR_PAGE_PATH,
} from "../../ui/paginator-state";

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
  const { get, set } = useStateStore();
  const initialPage = clampInitialPage(props.initialPage, pages.length);
  const page = clampPaginatorPage(
    pageFromValue(get(SNAP_PAGINATOR_PAGE_PATH), initialPage),
    pages.length,
  );
  const activePage = Math.min(page, Math.max(pages.length - 1, 0));
  const showControls = props.showControls !== false && pages.length > 1;
  const showIndicators = props.showIndicators !== false && pages.length > 1;
  const controlsPosition = props.controlsPosition === "top" ? "top" : "bottom";
  const transition =
    props.transition === "fade" ||
    props.transition === "scale" ||
    props.transition === "none"
      ? props.transition
      : "slide";
  const showControlBar = showControls || showIndicators;
  const [transitionDirection, setTransitionDirection] =
    useState<"next" | "previous">("next");
  const pageAnim = useRef(new Animated.Value(1)).current;

  const canGoPrev = activePage > 0;
  const canGoNext = activePage < pages.length - 1;
  const goToPage = (targetPage: number) => {
    const nextPage = clampPaginatorPage(targetPage, pages.length);
    if (nextPage !== activePage) {
      setTransitionDirection(nextPage > activePage ? "next" : "previous");
    }
    set(SNAP_PAGINATOR_PAGE_PATH, nextPage);
  };
  const goPrev = () => goToPage(activePage - 1);
  const goNext = () => goToPage(activePage + 1);

  useEffect(() => {
    if (pages.length === 0) return;
    const nextPage = clampPaginatorPage(
      pageFromValue(get(SNAP_PAGINATOR_PAGE_PATH), initialPage),
      pages.length,
    );
    if (get(SNAP_PAGINATOR_PAGE_PATH) !== nextPage) {
      set(SNAP_PAGINATOR_PAGE_PATH, nextPage);
    }
    if (get(SNAP_PAGINATOR_PAGE_COUNT_PATH) !== pages.length) {
      set(SNAP_PAGINATOR_PAGE_COUNT_PATH, pages.length);
    }
  }, [get, initialPage, pages.length, set]);

  useEffect(() => {
    if (transition === "none") {
      pageAnim.setValue(1);
      return;
    }
    pageAnim.setValue(0);
    Animated.timing(pageAnim, {
      toValue: 1,
      duration: transition === "scale" ? 240 : transition === "slide" ? 260 : 180,
      useNativeDriver: true,
    }).start();
  }, [activePage, pageAnim, transition]);

  if (pages.length === 0) return null;

  const controlBar = showControlBar ? (
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
  ) : null;

  const animatedPageStyle =
    transition === "none"
      ? undefined
      : {
          opacity: pageAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [transition === "fade" ? 0.2 : 0.35, 1],
          }),
          transform:
            transition === "scale"
              ? [
                  {
                    scale: pageAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ]
              : transition === "slide"
                ? [
                    {
                      translateX: pageAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          transitionDirection === "previous" ? -22 : 22,
                          0,
                        ],
                      }),
                    },
                    {
                      scale: pageAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.985, 1],
                      }),
                    },
                  ]
                : [],
        };

  return (
    <View style={styles.wrap}>
      {controlsPosition === "top" ? controlBar : null}
      <Animated.View
        style={[
          styles.page,
          animatedPageStyle,
        ]}
      >
        {pages[activePage]}
      </Animated.View>
      {controlsPosition === "bottom" ? controlBar : null}
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
