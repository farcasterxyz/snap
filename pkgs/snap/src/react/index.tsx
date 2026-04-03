"use client";

import type { Spec } from "@json-render/core";
import { snapJsonRenderCatalog } from "../ui/index.js";
import { SnapCatalogView } from "./catalog-renderer";
import { SnapPreviewAccentProvider } from "./accent-context";
import { resolveSnapPaletteHex } from "./lib/resolve-palette-hex";
import { snapPreviewPrimaryCssProperties } from "./lib/preview-primary-css";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ─── Public types ──────────────────────────────────────

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPage = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  ui: Spec;
};

export type SnapActionHandlers = {
  submit: (target: string, inputs: Record<string, JsonValue>) => void;
  open_url: (target: string) => void;
  open_mini_app: (target: string) => void;
  view_cast: (params: { hash: string }) => void;
  view_profile: (params: { fid: number }) => void;
  compose_cast: (params: {
    text?: string;
    channelKey?: string;
    embeds?: string[];
  }) => void;
  view_token: (params: { token: string }) => void;
  send_token: (params: {
    token: string;
    amount?: string;
    recipientFid?: number;
    recipientAddress?: string;
  }) => void;
  swap_token: (params: {
    sellToken?: string;
    buyToken?: string;
  }) => void;
};

// ─── Internal helpers ──────────────────────────────────

function applyStatePaths(
  model: Record<string, unknown>,
  changes: { path: string; value: unknown }[] | Record<string, unknown>,
): void {
  const entries = Array.isArray(changes)
    ? changes.map((c) => [c.path, c.value] as const)
    : Object.entries(changes);
  for (const [path, value] of entries) {
    const trimmed = path.startsWith("/") ? path : `/${path}`;
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length < 2) continue;
    const [top, ...rest] = parts;
    if (top === "inputs") {
      if (typeof model.inputs !== "object" || model.inputs === null) {
        model.inputs = {};
      }
      const inputs = model.inputs as Record<string, unknown>;
      if (rest.length === 1) {
        inputs[rest[0]!] = value;
      }
      continue;
    }
    if (top === "theme") {
      if (typeof model.theme !== "object" || model.theme === null) {
        model.theme = {};
      }
      const theme = model.theme as Record<string, unknown>;
      if (rest.length === 1) {
        theme[rest[0]!] = value;
      }
    }
  }
}

const CONFETTI_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
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
      {pieces.map(({ id, left, delay, duration, color, size, rotation }) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: `${left}%`,
            top: -20,
            width: size,
            height: size * 0.6,
            backgroundColor: color,
            borderRadius: 2,
            transform: `rotate(${rotation}deg)`,
            animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
          }}
        />
      ))}
      <style>{`@keyframes confettiFall{0%{top:-20px;opacity:1;transform:rotate(0deg) translateX(0)}50%{opacity:1}100%{top:110%;opacity:0;transform:rotate(720deg) translateX(${Math.random() > 0.5 ? "" : "-"}40px)}}`}</style>
    </div>
  );
}

const PALETTE = [
  "gray",
  "blue",
  "red",
  "amber",
  "green",
  "teal",
  "purple",
  "pink",
] as const;

// ─── SnapView ──────────────────────────────────────────

export function SnapView({
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
  const spec = snap.ui;
  const initialState = useMemo(
    () => spec.state ?? { inputs: {} },
    [spec],
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
      console.warn("[SnapView] catalog validation issues:", result.error);
    }
  }, [spec]);

  const [pageKey, setPageKey] = useState(0);
  useEffect(() => {
    setPageKey((k) => k + 1);
  }, [spec]);

  const showConfetti = snap.effects?.includes("confetti");

  const previewSurfaceStyle = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const c of PALETTE)
      vars[`--snap-color-${c}`] = resolveSnapPaletteHex(c, appearance);
    return {
      ...snapPreviewPrimaryCssProperties(
        snap.theme?.accent ?? "purple",
        appearance,
      ),
      ...vars,
    } as CSSProperties;
  }, [snap.theme?.accent, appearance]);

  const handleAction = useCallback(
    (name: unknown, params: unknown) => {
      const inputs = (stateRef.current.inputs ?? {}) as Record<
        string,
        JsonValue
      >;
      const p = (params ?? {}) as Record<string, unknown>;
      switch (name) {
        case "submit":
          handlers.submit(String(p.target ?? ""), inputs);
          break;
        case "open_url":
          handlers.open_url(String(p.target ?? ""));
          break;
        case "open_mini_app":
          handlers.open_mini_app(String(p.target ?? ""));
          break;
        case "view_cast":
          handlers.view_cast({ hash: String(p.hash ?? "") });
          break;
        case "view_profile":
          handlers.view_profile({ fid: Number(p.fid ?? 0) });
          break;
        case "compose_cast":
          handlers.compose_cast({
            text: p.text ? String(p.text) : undefined,
            channelKey: p.channelKey ? String(p.channelKey) : undefined,
            embeds: Array.isArray(p.embeds)
              ? (p.embeds as string[])
              : undefined,
          });
          break;
        case "view_token":
          handlers.view_token({ token: String(p.token ?? "") });
          break;
        case "send_token":
          handlers.send_token({
            token: String(p.token ?? ""),
            amount: p.amount ? String(p.amount) : undefined,
            recipientFid: p.recipientFid
              ? Number(p.recipientFid)
              : undefined,
            recipientAddress: p.recipientAddress
              ? String(p.recipientAddress)
              : undefined,
          });
          break;
        case "swap_token":
          handlers.swap_token({
            sellToken: p.sellToken ? String(p.sellToken) : undefined,
            buyToken: p.buyToken ? String(p.buyToken) : undefined,
          });
          break;
        default:
          break;
      }
    },
    [handlers],
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {showConfetti && <ConfettiOverlay />}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            fontSize: 14,
            color: "var(--text-muted)",
            background: "var(--bg-primary, rgba(0,0,0,0.6))",
            backdropFilter: "blur(4px)",
          }}
        >
          Loading...
        </div>
      )}

      <div style={previewSurfaceStyle}>
        <SnapPreviewAccentProvider pageAccent={snap.theme?.accent}>
          <SnapCatalogView
            key={pageKey}
            spec={spec}
            state={initialState}
            loading={false}
            onStateChange={(changes) => {
              applyStatePaths(stateRef.current, changes);
            }}
            onAction={handleAction}
          />
        </SnapPreviewAccentProvider>
      </div>
    </div>
  );
}
