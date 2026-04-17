"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { validateSnapResponse } from "../../validator.js";
import type { ValidationResult } from "../../validator.js";
import { SnapViewCore, SnapLoadingOverlay } from "../snap-view-core";
import { resolveSnapPaletteHex } from "../lib/resolve-palette-hex";
import type { SnapPage, SnapActionHandlers } from "../index";

const SNAP_MAX_HEIGHT = 500;
const SNAP_WARNING_HEIGHT = 700;

// ─── Default validation error fallback ────────────────

function SnapValidationFallback({
  appearance,
  message,
}: {
  appearance: "light" | "dark";
  message?: string;
}) {
  const isDark = appearance === "dark";
  return (
    <div
      style={{
        width: "100%",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
        fontSize: 14,
      }}
    >
      <span>{message ? `Unable to render snap: ${message}` : "Unable to render snap"}</span>
    </div>
  );
}

// ─── SnapViewV2 ──────────────────────────────────────

export function SnapViewV2({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  onValidationError,
  validationErrorFallback,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  const validation = useMemo(() => validateSnapResponse(snap), [snap]);
  const valid = validation.valid;
  const validationMessage = validation.issues[0]?.message;

  useEffect(() => {
    if (!valid) {
      if (onValidationError) {
        onValidationError(validation);
      } else {
        // eslint-disable-next-line no-console
        console.warn("[Snap] validation issues:", validation.issues);
      }
    }
  }, [valid, validation, onValidationError]);

  if (!valid) {
    if (validationErrorFallback === null) return null;
    return <>{validationErrorFallback ?? <SnapValidationFallback appearance={appearance} message={validationMessage} />}</>;
  }

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

// ─── SnapCardV2 ──────────────────────────────────────

export function SnapCardV2({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  maxWidth = 480,
  showOverflowWarning = false,
  onValidationError,
  validationErrorFallback,
  actionError,
  plain = false,
  loadingOverlay,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  maxWidth?: number;
  showOverflowWarning?: boolean;
  onValidationError?: (result: ValidationResult) => void;
  validationErrorFallback?: ReactNode;
  actionError?: string | null;
  plain?: boolean;
  /** Custom content rendered while `loading` is true. Pass `null` to render nothing. */
  loadingOverlay?: ReactNode;
}) {
  const isDark = appearance === "dark";
  const bg = isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)";
  const toggleBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const toggleBgHover = isDark
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.08)";
  const toggleText = isDark ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.72)";
  const accentHex = useMemo(
    () => resolveSnapPaletteHex(snap.theme?.accent ?? "purple", appearance),
    [snap.theme?.accent, appearance],
  );

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
  }, [snap, plain, showOverflowWarning]);

  useEffect(() => {
    if (!isExpandable) {
      setIsExpanded(false);
    }
  }, [isExpandable]);

  const isClipped = !showOverflowWarning && isExpandable && !isExpanded;
  const containerMaxHeight = showOverflowWarning ? SNAP_WARNING_HEIGHT : undefined;

  return (
    <>
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
          maxHeight: containerMaxHeight,
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
              ? { maxHeight: SNAP_MAX_HEIGHT, overflow: "hidden" }
              : undefined
          }
        >
          <div ref={contentRef} style={plain ? undefined : { padding: 16 }}>
            <SnapViewV2
              snap={snap}
              handlers={handlers}
              loading={loading}
              appearance={appearance}
              onValidationError={onValidationError}
              validationErrorFallback={validationErrorFallback}
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
        {showOverflowWarning && (
          <div
            style={{
              position: "absolute",
              top: SNAP_MAX_HEIGHT,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div style={{ borderTop: "1px dashed rgba(255,100,100,0.6)", position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  top: -10,
                  right: 0,
                  fontSize: 10,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  color: "rgba(255,100,100,0.7)",
                  background: bg,
                  padding: "1px 4px",
                  borderRadius: 3,
                }}
              >
                {SNAP_MAX_HEIGHT}px
              </span>
            </div>
            <div
              style={{
                height: "100%",
                background:
                  "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,100,100,0.06) 8px, rgba(255,100,100,0.06) 16px)",
              }}
            />
          </div>
        )}
      </div>
      {!showOverflowWarning && isExpandable ? (
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
    </div>
    {actionError && (
      <div
        style={{
          maxWidth,
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
    </>
  );
}
