"use client";

import { Children, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { useSnapPaginatorActions } from "../paginator-action-context";

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
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div className="w-full min-w-0">{pages[activePage]}</div>
      {(showControls || showIndicators) && (
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
      )}
    </div>
  );
}
