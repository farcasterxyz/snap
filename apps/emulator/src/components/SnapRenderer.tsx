"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { snapJsonRenderCatalog } from "@farcaster/snap-ui-elements";
import { SnapCatalogView } from "./snapCatalogRenderer";
import { snapPageToJsonRenderSpec } from "../lib/snapPageToJsonRenderSpec";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPage = {
  version: string;
  page: {
    theme?: { accent?: string };
    effects?: string[];
    elements: { type: string; children: Array<Record<string, JsonValue>> };
    buttons?: Array<Record<string, JsonValue>>;
    button_layout?: "stack" | "row" | "grid";
  };
};

const CONFETTI_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#F97316",
];

function ConfettiOverlay() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.5 + Math.random() * 2,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 80,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      })),
    [],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -12,
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 0.5,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall-${p.id % 3} ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall-0 {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(600px) translateX(40px) rotate(540deg); opacity: 0; }
        }
        @keyframes confetti-fall-1 {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(550px) translateX(-50px) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-fall-2 {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          30% { opacity: 1; transform: translateY(150px) translateX(20px) rotate(200deg) scale(1.1); }
          100% { transform: translateY(500px) translateX(-30px) rotate(900deg) scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function applyStatePaths(
  model: Record<string, unknown>,
  changes: Array<{ path: string; value: unknown }>,
): void {
  for (const { path, value } of changes) {
    const trimmed = path.replace(/^\//, "");
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length < 2) continue;
    const [top, ...rest] = parts;
    let cursor: Record<string, unknown> = model;
    if (top === "inputs") {
      if (typeof cursor.inputs !== "object" || cursor.inputs === null) {
        cursor.inputs = {};
      }
      const inputs = cursor.inputs as Record<string, unknown>;
      if (rest.length === 1) {
        inputs[rest[0]!] = value;
      }
      continue;
    }
    if (top === "theme") {
      if (typeof cursor.theme !== "object" || cursor.theme === null) {
        cursor.theme = {};
      }
      const theme = cursor.theme as Record<string, unknown>;
      if (rest.length === 1) {
        theme[rest[0]!] = value;
      }
    }
  }
}

export function SnapRenderer({
  snap,
  onPostButton,
  onLinkButton,
  loading,
}: {
  snap: SnapPage;
  onPostButton: (
    buttonIndex: number,
    button: Record<string, JsonValue>,
    inputs: Record<string, JsonValue>,
  ) => void;
  /**
   * When set, link buttons call this instead of opening a new tab immediately.
   * The emulator uses this to try loading the URL as a snap first.
   */
  onLinkButton?: (target: string) => void | Promise<void>;
  loading: boolean;
}) {
  const { spec, initialState } = useMemo(
    () => snapPageToJsonRenderSpec(snap),
    [snap],
  );

  const stateRef = useRef<Record<string, unknown>>(initialState);

  useEffect(() => {
    stateRef.current = {
      inputs: {
        ...((initialState.inputs ?? {}) as Record<string, unknown>),
      },
      theme: {
        ...((initialState.theme ?? {}) as Record<string, unknown>),
      },
    };
  }, [initialState]);

  useEffect(() => {
    const result = snapJsonRenderCatalog.validate(spec);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn(
        "[emulator] json-render spec validation failed",
        result.error,
      );
    }
  }, [spec]);

  const pageKey = useMemo(() => JSON.stringify(snap.page), [snap.page]);

  const hasConfetti = snap.page.effects?.includes("confetti") ?? false;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (hasConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [pageKey, hasConfetti]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--snap-card-bg)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {showConfetti && <ConfettiOverlay />}

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--snap-card-bg, rgba(255,255,255,0.7))",
            opacity: 0.85,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          Loading...
        </div>
      )}

      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        <SnapCatalogView
          key={pageKey}
          spec={spec}
          state={initialState}
          loading={false}
          onStateChange={(changes) => {
            applyStatePaths(stateRef.current, changes);
          }}
          onAction={(name, params) => {
            const inputs = (stateRef.current.inputs ?? {}) as Record<
              string,
              JsonValue
            >;
            switch (name) {
              case "snap_post": {
                const idx = Number(params?.buttonIndex ?? 0);
                const btn =
                  (snap.page.buttons?.[idx] as Record<string, JsonValue>) ?? {};
                onPostButton(idx, btn, inputs);
                break;
              }
              case "snap_link": {
                const target = String(params?.target ?? "");
                if (!target) break;
                if (onLinkButton) {
                  void onLinkButton(target);
                } else if (typeof window !== "undefined") {
                  window.open(target, "_blank", "noopener,noreferrer");
                }
                break;
              }
              case "snap_mini_app":
              case "snap_sdk": {
                // eslint-disable-next-line no-console
                console.info(`[emulator] ${name}`, params);
                break;
              }
              default:
                break;
            }
          }}
        />
      </div>
    </div>
  );
}
