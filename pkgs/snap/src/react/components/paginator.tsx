"use client";

import { Children, type ReactNode, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@neynar/ui/utils";
import { useSnapColors } from "../hooks/use-snap-colors";
import { SnapPaginatorActionContext } from "../paginator-action-context";

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
    <div className="flex w-full min-w-0 flex-col gap-2">
      <SnapPaginatorActionContext.Provider value={actions}>
        <div className="w-full min-w-0">{pages[activePage]}</div>
      </SnapPaginatorActionContext.Provider>
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
              {pages.map((_, index) => (
                <span
                  key={index}
                  aria-label={`Page ${index + 1}${index === activePage ? ", current" : ""}`}
                  className="block size-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      index === activePage ? colors.accent : colors.border,
                  }}
                />
              ))}
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
