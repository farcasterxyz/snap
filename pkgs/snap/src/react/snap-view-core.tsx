"use client";

import type { Spec } from "@json-render/core";
import { createStateStore } from "@json-render/react";
import { snapJsonRenderCatalog } from "../ui/index.js";
import { SnapCatalogView } from "./catalog-renderer";
import { SnapPreviewAccentProvider } from "./accent-context";
import { SnapVersionProvider } from "./snap-version-context";
import { resolveSnapPaletteHex } from "./lib/resolve-palette-hex";
import { snapPreviewPrimaryCssProperties } from "./lib/preview-primary-css";
import {
  buildActionActivityStateChanges,
  buildInitialRenderState,
  cloneSnapRenderState,
  getUnpresentedSnapEffects,
  hasPendingSnapAction,
  markSnapEffectsPresented,
  optionalSnapStringArray,
  resolveSnapActionParamsForAction,
  validateSnapActionTargetUrl,
  type SnapRenderState,
} from "../render-state";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { JsonValue, SnapActionHandlers, SnapPage } from "./index";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown): string | undefined {
  return value ? String(value) : undefined;
}

function validActionTarget(value: unknown): string | undefined {
  const target = String(value ?? "");
  return validateSnapActionTargetUrl(target) ? undefined : target;
}

function literalStringParam(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function withDefaultElementProps(spec: Spec): Spec {
  if (!spec || typeof spec !== "object" || !("elements" in spec)) return spec;
  const elements = spec.elements as unknown as Record<
    string,
    Record<string, unknown>
  >;
  if (!elements || typeof elements !== "object") return spec;

  let changed = false;
  const nextElements: Record<string, Record<string, unknown>> = {};
  for (const [id, element] of Object.entries(elements)) {
    if (element.props !== undefined) {
      nextElements[id] = element;
      continue;
    }
    changed = true;
    nextElements[id] = { ...element, props: {} };
  }

  return changed
    ? ({ ...spec, elements: nextElements } as unknown as Spec)
    : spec;
}

const CONFETTI_COLORS = [
  "#907AA9",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
];

const FIREWORK_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#C4A7E7",
  "#F6C177",
  "#EBBCBA",
  "#9CCFD8",
  "#fff",
];

function ConfettiOverlay() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const driftX = (Math.random() - 0.5) * 120;
        return {
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 1.2,
          duration: 2.8 + Math.random() * 1.8,
          color:
            CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          isCircle: Math.random() > 0.6,
          driftX,
          driftMid: -driftX * 0.4,
        };
      }),
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
      {pieces.map(
        ({
          id,
          left,
          delay,
          duration,
          color,
          size,
          rotation,
          isCircle,
          driftX,
          driftMid,
        }) => (
          <div
            key={id}
            style={
              {
                position: "absolute",
                left: `${left}%`,
                top: -20,
                width: size,
                height: isCircle ? size : size * 0.5,
                backgroundColor: color,
                borderRadius: isCircle ? "50%" : 2,
                transform: `rotateZ(${rotation}deg)`,
                animation: `confettiFall ${duration}s cubic-bezier(0.25,0,0.75,1) ${delay}s forwards`,
                "--dx": `${driftX}px`,
                "--dm": `${driftMid}px`,
              } as CSSProperties
            }
          />
        ),
      )}
      <style>{`@keyframes confettiFall{
        0%  {top:-20px;opacity:1;transform:rotateZ(0deg) rotateY(0deg) translateX(0)}
        20% {transform:rotateZ(144deg) rotateY(60deg) translateX(var(--dm))}
        40% {transform:rotateZ(288deg) rotateY(120deg) translateX(0)}
        60% {opacity:1;transform:rotateZ(432deg) rotateY(200deg) translateX(calc(-1 * var(--dm)))}
        80% {transform:rotateZ(576deg) rotateY(280deg) translateX(var(--dx))}
        100%{top:110%;opacity:0;transform:rotateZ(720deg) rotateY(360deg) translateX(var(--dx))}
      }`}</style>
    </div>
  );
}

function FireworksOverlay() {
  const bursts = useMemo(
    () =>
      Array.from({ length: 5 }, (_, b) => ({
        id: b,
        x: 15 + Math.random() * 70,
        y: 10 + Math.random() * 50,
        delay: b * 0.5 + Math.random() * 0.2,
        particles: Array.from({ length: 24 }, (_, p) => {
          const angle = (p / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
          const dist = 55 + Math.random() * 60;
          return {
            id: p,
            vx: Math.cos(angle) * dist,
            vy: Math.sin(angle) * dist,
            color:
              FIREWORK_COLORS[
                Math.floor(Math.random() * FIREWORK_COLORS.length)
              ],
            size: 3 + Math.random() * 3,
          };
        }),
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
      {bursts.map(({ id: bid, x, y, delay, particles }) => (
        <div key={bid}>
          <div
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#fff",
              transform: "translate(-50%,-50%)",
              animation: `fwFlash 0.4s ease-out ${delay}s both`,
              opacity: 0,
            }}
          />
          {particles.map(({ id: pid, vx, vy, color, size }) => (
            <div
              key={pid}
              style={
                {
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  backgroundColor: color,
                  transform: "translate(-50%,-50%)",
                  animation: `fwBurst 1s cubic-bezier(0.2,0,0.8,1) ${delay}s forwards`,
                  opacity: 0,
                  "--vx": `${vx}px`,
                  "--vy": `${vy}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes fwFlash{
          0%  {opacity:0;transform:translate(-50%,-50%) scale(0)}
          25% {opacity:1;transform:translate(-50%,-50%) scale(2.5)}
          100%{opacity:0;transform:translate(-50%,-50%) scale(5)}
        }
        @keyframes fwBurst{
          0%  {opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}
          65% {opacity:1}
          100%{opacity:0;transform:translate(-50%,-50%) translate(var(--vx),var(--vy)) scale(0)}
        }
      `}</style>
    </div>
  );
}

export function SnapLoadingOverlay({
  appearance,
  accentHex,
  active,
}: {
  appearance: "light" | "dark";
  accentHex: string;
  active: boolean;
}) {
  const isDark = appearance === "dark";
  const tint = isDark ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.2)";
  const trackColor = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(15, 23, 42, 0.1)";

  return (
    <div
      data-snap-loading-overlay
      data-snap-loading-active={active ? "true" : "false"}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        background: tint,
        backdropFilter: active ? "blur(10px) saturate(1.05)" : "none",
        WebkitBackdropFilter: active ? "blur(10px) saturate(1.05)" : "none",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 0.28s ease, backdrop-filter 0.28s ease",
      }}
      aria-hidden={!active}
      aria-busy={active ? true : undefined}
      aria-live={active ? "polite" : undefined}
      aria-label={active ? "Loading" : undefined}
    >
      <div
        data-snap-loading-spinner
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: `2.5px solid ${trackColor}`,
          borderTopColor: accentHex,
          opacity: 0.88,
          animation: "snapViewSpin 0.75s linear infinite",
          flexShrink: 0,
        }}
      />
      <style>{`
        [data-snap-view-root]:has([data-snap-action-pending-active="true"])
          [data-snap-loading-overlay] {
          opacity: 1 !important;
          pointer-events: auto !important;
          backdrop-filter: blur(10px) saturate(1.05) !important;
          -webkit-backdrop-filter: blur(10px) saturate(1.05) !important;
        }
        [data-snap-card-surface]:has([data-snap-action-pending-active="true"])
          > [data-snap-loading-overlay] {
          opacity: 1 !important;
          pointer-events: auto !important;
          backdrop-filter: blur(10px) saturate(1.05) !important;
          -webkit-backdrop-filter: blur(10px) saturate(1.05) !important;
        }
        @keyframes snapViewSpin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-snap-loading-spinner] {
            animation: none;
            border-top-color: ${accentHex};
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  );
}

function SnapPendingActionOverlay({
  appearance,
  accentHex,
}: {
  appearance: "light" | "dark";
  accentHex: string;
}) {
  return (
    <SnapLoadingOverlay
      appearance={appearance}
      accentHex={accentHex}
      active={false}
    />
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

// ─── SnapViewCore ────────────────────────────────────
// Shared rendering logic used by both v1 and v2.

export function SnapViewCore({
  snap,
  handlers,
  loading = false,
  appearance = "dark",
  loadingOverlay,
  initialRenderState,
  onRenderStateChange,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  appearance?: "light" | "dark";
  /**
   * Custom content rendered while `loading` is true. When `undefined` (default)
   * the built-in spinner + backdrop is used. Pass `null` to render nothing.
   */
  loadingOverlay?: ReactNode;
  initialRenderState?: SnapRenderState;
  onRenderStateChange?: (state: SnapRenderState) => void;
}) {
  const spec = useMemo(() => withDefaultElementProps(snap.ui), [snap.ui]);
  const initialState = useMemo(
    () =>
      buildInitialRenderState({
        specState: spec.state,
        initialRenderState,
        themeAccent: snap.theme?.accent,
      }),
    [initialRenderState, spec.state, snap.theme?.accent],
  );

  const stateStore = useMemo(() => createStateStore(initialState), [
    initialState,
  ]);
  const stateRef = useRef<Record<string, unknown>>(initialState);
  const onRenderStateChangeRef = useRef(onRenderStateChange);
  const pendingActionCountRef = useRef(0);

  useEffect(() => {
    stateRef.current = cloneSnapRenderState(initialState);
  }, [initialState]);

  useEffect(() => {
    onRenderStateChangeRef.current = onRenderStateChange;
  }, [onRenderStateChange]);

  useEffect(
    () =>
      stateStore.subscribe(() => {
        const snapshot = cloneSnapRenderState(stateStore.getSnapshot());
        stateRef.current = snapshot;
        onRenderStateChangeRef.current?.(snapshot);
      }),
    [stateStore],
  );

  useEffect(() => {
    const catalogResult = snapJsonRenderCatalog.validate(spec);
    if (!catalogResult.success) {
      // eslint-disable-next-line no-console
      console.warn("[Snap] catalog validation issues:", catalogResult.error);
    }
  }, [spec]);

  const [pageKey, setPageKey] = useState(0);
  useEffect(() => {
    setPageKey((k) => k + 1);
  }, [spec]);

  const effectSignature = snap.effects?.join("\u0000") ?? "";
  const snapEffects = useMemo(
    () => (effectSignature ? effectSignature.split("\u0000") : []),
    [effectSignature],
  );
  const showConfetti = snapEffects.includes("confetti");
  const showFireworks = snapEffects.includes("fireworks");
  const [effectRunKeys, setEffectRunKeys] = useState({
    confetti: 0,
    fireworks: 0,
  });
  useEffect(() => {
    const effectsToPresent = getUnpresentedSnapEffects(
      stateRef.current,
      snapEffects,
    );

    if (effectsToPresent.length === 0) {
      setEffectRunKeys((current) => {
        const next = {
          confetti: showConfetti ? current.confetti : 0,
          fireworks: showFireworks ? current.fireworks : 0,
        };
        return next.confetti === current.confetti &&
          next.fireworks === current.fireworks
          ? current
          : next;
      });
      return;
    }

    if (markSnapEffectsPresented(stateRef.current, effectsToPresent)) {
      const meta = recordValue(stateRef.current.__snapRender);
      stateStore.update({
        "/__snapRender/presentedEffects": meta?.presentedEffects ?? [],
      });
    }

    setEffectRunKeys((current) => ({
      confetti: effectsToPresent.includes("confetti")
        ? current.confetti + 1
        : showConfetti
          ? current.confetti
          : 0,
      fireworks: effectsToPresent.includes("fireworks")
        ? current.fireworks + 1
        : showFireworks
          ? current.fireworks
          : 0,
    }));
  }, [initialState, showConfetti, showFireworks, snapEffects, stateStore]);

  const accentName = snap.theme?.accent ?? "purple";

  const accentHex = useMemo(
    () => resolveSnapPaletteHex(accentName, appearance),
    [accentName, appearance],
  );

  const previewSurfaceStyle = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const c of PALETTE)
      vars[`--snap-color-${c}`] = resolveSnapPaletteHex(c, appearance);
    return {
      ...snapPreviewPrimaryCssProperties(accentName, appearance),
      ...vars,
    } as CSSProperties;
  }, [accentName, appearance]);

  const applyActionActivityState = useCallback(
    (name: unknown, params: Record<string, unknown>, pending: boolean) => {
      stateStore.update(
        Object.fromEntries(
          buildActionActivityStateChanges({
            actionName: name,
            params,
            pending,
          }).map(({ path, value }) => [path, value]),
        ),
      );
    },
    [stateStore],
  );

  const setActionPending = useCallback(
    (name: unknown, params: Record<string, unknown>) => {
      pendingActionCountRef.current += 1;
      applyActionActivityState(name, params, true);
    },
    [applyActionActivityState],
  );

  const setActionSettled = useCallback(
    (name: unknown, params: Record<string, unknown>) => {
      pendingActionCountRef.current = Math.max(
        0,
        pendingActionCountRef.current - 1,
      );
      applyActionActivityState(name, params, false);
    },
    [applyActionActivityState],
  );

  const handleAction = useCallback(
    (name: unknown, params: unknown) => {
      const p = resolveSnapActionParamsForAction(
        name,
        params,
        stateRef.current,
      );
      const inputs = (stateRef.current.inputs ?? {}) as Record<
        string,
        JsonValue
      >;
      let result: unknown;
      setActionPending(name, p);

      switch (name) {
        case "submit":
          result = handlers.submit(literalStringParam(p.target), inputs);
          break;
        case "open_url": {
          const target = validActionTarget(p.target);
          if (target) result = handlers.open_url(target);
          break;
        }
        case "open_snap": {
          const target = validActionTarget(p.target);
          if (target) result = handlers.open_snap(target);
          break;
        }
        case "open_mini_app": {
          const target = validActionTarget(p.target);
          if (target) result = handlers.open_mini_app(target);
          break;
        }
        case "view_cast":
          result = handlers.view_cast({ hash: String(p.hash ?? "") });
          break;
        case "view_profile":
          result = handlers.view_profile({ fid: Number(p.fid ?? 0) });
          break;
        case "view_channel":
          result = handlers.view_channel({
            channelKey: String(p.channelKey ?? ""),
          });
          break;
        case "compose_cast":
          result = handlers.compose_cast({
            text: p.text ? String(p.text) : undefined,
            channelKey: p.channelKey ? String(p.channelKey) : undefined,
            embeds: optionalSnapStringArray(p.embeds),
          });
          break;
        case "view_token":
          result = handlers.view_token({ token: String(p.token ?? "") });
          break;
        case "send_token":
          result = handlers.send_token({
            token: String(p.token ?? ""),
            amount: p.amount ? String(p.amount) : undefined,
            recipientFid: p.recipientFid ? Number(p.recipientFid) : undefined,
            recipientAddress: p.recipientAddress
              ? String(p.recipientAddress)
              : undefined,
          });
          break;
        case "swap_token":
          result = handlers.swap_token({
            sellToken: p.sellToken ? String(p.sellToken) : undefined,
            buyToken: p.buyToken ? String(p.buyToken) : undefined,
          });
          break;
        case "send_transaction":
          result = handlers.send_transaction?.({
            chainId: String(p.chainId ?? ""),
            to: String(p.to ?? ""),
            data: optionalString(p.data),
            value: optionalString(p.value),
            gas: optionalString(p.gas),
            gasPrice: optionalString(p.gasPrice),
            maxFeePerGas: optionalString(p.maxFeePerGas),
            maxPriorityFeePerGas: optionalString(p.maxPriorityFeePerGas),
          });
          break;
        default:
          break;
      }

      if (result instanceof Promise) {
        void result.finally(() => {
          setActionSettled(name, p);
        }).catch(() => {});
      } else {
        setActionSettled(name, p);
      }
      return result;
    },
    [handlers, setActionPending, setActionSettled],
  );

  return (
    <div
      data-snap-view-root
      style={{ position: "relative", width: "100%" }}
      onClickCapture={(event) => {
        if (!hasPendingSnapAction(stateRef.current)) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {showConfetti && effectRunKeys.confetti > 0 && (
        <ConfettiOverlay key={effectRunKeys.confetti} />
      )}
      {showFireworks && effectRunKeys.fireworks > 0 && (
        <FireworksOverlay key={effectRunKeys.fireworks} />
      )}
      {loadingOverlay === undefined ? (
        <SnapLoadingOverlay
          appearance={appearance}
          accentHex={accentHex}
          active={loading}
        />
      ) : loading ? (
        <>{loadingOverlay}</>
      ) : null}

      <div style={previewSurfaceStyle}>
        <SnapPreviewAccentProvider
          pageAccent={snap.theme?.accent}
          appearance={appearance}
        >
          <SnapVersionProvider value={snap.version === "2.0" ? "2.0" : "1.0"}>
            <SnapCatalogView
              key={pageKey}
              spec={spec}
              store={stateStore}
              loading={false}
              onAction={handleAction}
            >
              {loadingOverlay === undefined ? (
                <SnapPendingActionOverlay
                  appearance={appearance}
                  accentHex={accentHex}
                />
              ) : null}
            </SnapCatalogView>
          </SnapVersionProvider>
        </SnapPreviewAccentProvider>
      </div>
    </div>
  );
}
