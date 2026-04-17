"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { SnapViewCore, SnapLoadingOverlay } from "../snap-view-core";
import { resolveSnapPaletteHex } from "../lib/resolve-palette-hex";
import type { SnapPage, SnapActionHandlers } from "../index";

const SNAP_MAX_HEIGHT = 500;

export function SnapViewV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  return (
    <SnapViewCore
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={appearance}
      loadingOverlay={loadingOverlay}
    />
  );
}

export function SnapCardV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  maxWidth = 480,
  actionError,
  plain = false,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  actionError?: string | null;
  plain?: boolean;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  const isDark = appearance === "dark";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
  const toggleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const toggleBgHover = isDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.08)";
  const toggleText = isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.72)";
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExpandable, setIsExpandable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [snap]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const measure = () => {
      setIsExpandable(node.scrollHeight > SNAP_MAX_HEIGHT + 1);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [snap, plain]);

  useEffect(() => {
    if (!isExpandable) {
      setIsExpanded(false);
    }
  }, [isExpandable]);

  const isClipped = isExpandable && !isExpanded;

  const accentHex = useMemo(
    () => resolveSnapPaletteHex(snap.theme?.accent ?? "purple", appearance),
    [snap.theme?.accent, appearance],
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          ...(plain ? {} : {
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            backgroundColor: surfaceBg,
          }),
        }}
      >
        <div
          style={
            isClipped
              ? {
                  maxHeight: SNAP_MAX_HEIGHT,
                  overflow: "hidden",
                }
              : undefined
          }
        >
          <div ref={contentRef} style={plain ? undefined : { padding: 16 }}>
            <SnapViewV1
              snap={snap}
              handlers={handlers}
              loading={loading}
              appearance={appearance}
              loadingOverlay={null}
            />
          </div>
        </div>
        {loadingOverlay === undefined ? (
          <SnapLoadingOverlay
            appearance={appearance}
            accentHex={accentHex}
            active={loading}
          />
        ) : loading ? (
          <>{loadingOverlay}</>
        ) : null}
      </div>
      {isExpandable ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translate(-50%, 50%)",
            appearance: "none",
            border: `1px solid ${borderColor}`,
            borderRadius: 9999,
            backgroundColor: isDark ? "rgba(30,30,30,0.6)" : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(12px) saturate(180%)",
            WebkitBackdropFilter: "blur(12px) saturate(180%)",
            color: toggleText,
            padding: "2px 10px",
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: 600,
            cursor: "pointer",
            zIndex: 11,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = isDark
              ? "rgba(50,50,50,0.7)"
              : "rgba(245,245,245,0.75)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = isDark
              ? "rgba(30,30,30,0.6)"
              : "rgba(255,255,255,0.6)";
          }}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
      {actionError && (
        <div
          style={{
            padding: "8px 12px",
            fontSize: 13,
            color:
              appearance === "dark"
                ? "rgba(255,100,100,0.9)"
                : "rgba(200,0,0,0.8)",
          }}
        >
          {actionError}
        </div>
      )}
    </div>
  );
}
