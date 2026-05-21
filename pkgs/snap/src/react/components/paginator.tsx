"use client";

import {
  Children,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useStateStore } from "@json-render/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
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
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  const pages = useMemo(
    () => Children.toArray(children),
    [children],
  );
  const colors = useSnapColors();
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

  if (pages.length === 0) return null;

  const pageAnimation =
    transition === "none"
      ? undefined
      : transition === "fade"
        ? "snapPaginatorFade 180ms ease-out"
        : transition === "scale"
          ? "snapPaginatorScale 240ms cubic-bezier(0.16, 1, 0.3, 1)"
          : "snapPaginatorSlide 260ms cubic-bezier(0.16, 1, 0.3, 1)";

  const controlBar = showControlBar ? (
    <div className="flex min-h-7 w-full items-center justify-between gap-2">
      {showControls ? (
        <button
          type="button"
          aria-label="Previous page"
          disabled={!canGoPrev}
          onClick={goPrev}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md border text-sm transition-opacity",
            canGoPrev ? "cursor-pointer opacity-100" : "cursor-default opacity-35",
          )}
          style={{
            borderColor: colors.border,
            backgroundColor: colors.muted,
            color: colors.text,
          }}
        >
          <ChevronLeft size={15} />
        </button>
      ) : (
        <span />
      )}

      {showIndicators ? (
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {pages.map((_, index) => {
            const current = index === activePage;
            return (
              <span
                key={index}
                aria-label={`Page ${index + 1}${current ? ", current" : ""}`}
                className={cn(
                  "block rounded-full",
                  current ? "size-2.5" : "size-2",
                )}
                style={{
                  backgroundColor: current
                    ? colors.accent
                    : colors.mode === "dark"
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(0,0,0,0.28)",
                  boxShadow: current
                    ? `0 0 0 2px ${colors.mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"}`
                    : undefined,
                }}
              />
            );
          })}
        </div>
      ) : (
        <span className="flex-1" />
      )}

      {showControls ? (
        <button
          type="button"
          aria-label="Next page"
          disabled={!canGoNext}
          onClick={goNext}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md border text-sm transition-opacity",
            canGoNext ? "cursor-pointer opacity-100" : "cursor-default opacity-35",
          )}
          style={{
            borderColor: colors.border,
            backgroundColor: colors.muted,
            color: colors.text,
          }}
        >
          <ChevronRight size={15} />
        </button>
      ) : (
        <span />
      )}
    </div>
  ) : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {controlsPosition === "top" ? controlBar : null}
      <div
        key={activePage}
        data-snap-paginator-page
        className="w-full min-w-0"
        style={{
          "--snap-paginator-x": transitionDirection === "previous" ? "-22px" : "22px",
          animation: pageAnimation,
        } as CSSProperties}
      >
        {pages[activePage]}
      </div>
      {controlsPosition === "bottom" ? controlBar : null}
      <style>{`
        @keyframes snapPaginatorSlide {
          from { opacity: 0.35; transform: translateX(var(--snap-paginator-x, 22px)) scale(0.985); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes snapPaginatorFade {
          from { opacity: 0.2; }
          to { opacity: 1; }
        }
        @keyframes snapPaginatorScale {
          from { opacity: 0.25; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-snap-paginator-page] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
