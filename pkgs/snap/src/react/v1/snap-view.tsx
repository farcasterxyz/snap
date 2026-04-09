"use client";

import { useEffect, useRef, useState } from "react";
import { SnapViewCore } from "../snap-view-core";
import type { SnapPage, SnapActionHandlers } from "../index";

const SNAP_MAX_HEIGHT = 500;

export function SnapViewV1({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
}) {
  return (
    <SnapViewCore
      snap={snap}
      handlers={handlers}
      loading={loading}
      appearance={appearance}
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
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  actionError?: string | null;
  plain?: boolean;
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

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth,
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
          />
        </div>
      </div>
      {isExpandable ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: plain ? "8px 0 0" : "10px 16px 12px",
            ...(plain
              ? {}
              : { borderTop: `1px solid ${borderColor}` }),
          }}
        >
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((value) => !value)}
            style={{
              appearance: "none",
              border: "none",
              borderRadius: 9999,
              backgroundColor: toggleBg,
              color: toggleText,
              padding: "6px 10px",
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = toggleBgHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = toggleBg;
            }}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        </div>
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
