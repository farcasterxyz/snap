import type { Spec } from "@json-render/core";
import { createStateStore } from "@json-render/react-native";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapCatalogView } from "./catalog-renderer";
import { ConfettiOverlay } from "./confetti-overlay";
import { FireworksOverlay } from "./fireworks-overlay";
import { useSnapTheme } from "./theme";
import { SnapVersionProvider } from "./snap-version-context";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  DEFAULT_THEME_ACCENT,
  PALETTE_LIGHT_HEX,
  PALETTE_DARK_HEX,
  type PaletteColor,
} from "@farcaster/snap";
import {
  buildActionActivityStateChanges,
  buildInitialRenderState,
  cloneSnapRenderState,
  getUnpresentedSnapEffects,
  hasPendingSnapAction,
  markSnapEffectsPresented,
  optionalSnapStringArray,
  resolveSnapActionParams,
  validateSnapActionTargetUrl,
  type SnapRenderState,
} from "../render-state";
import type { SnapPage, SnapActionHandlers, JsonValue } from "./types";

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

export function resolveAccentHex(
  accent: string | undefined,
  appearance: "light" | "dark",
): string {
  const map = appearance === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;
  const name =
    accent && Object.hasOwn(map, accent)
      ? (accent as PaletteColor)
      : DEFAULT_THEME_ACCENT;
  return map[name];
}

// ─── Core rendering component (no validation) ────────

export function SnapViewCoreInner({
  snap,
  handlers,
  loading = false,
  loadingOverlay,
  initialRenderState,
  onRenderStateChange,
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
  /**
   * Custom content rendered while `loading` is true. When `undefined` (default)
   * the built-in ActivityIndicator overlay is used. Pass `null` to render nothing.
   */
  loadingOverlay?: ReactNode;
  initialRenderState?: SnapRenderState;
  onRenderStateChange?: (state: SnapRenderState) => void;
}) {
  const { mode } = useSnapTheme();
  const spec = useMemo(
    () => withDefaultElementProps(snap.ui as unknown as Spec) as SnapPage["ui"],
    [snap.ui],
  );
  const accentHex = resolveAccentHex(snap.theme?.accent, mode);

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
  const [hasPendingAction, setHasPendingAction] = useState(false);
  const [actionActivityVersion, setActionActivityVersion] = useState(0);

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
        setHasPendingAction(hasPendingSnapAction(snapshot));
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

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

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
      setHasPendingAction(true);
      setActionActivityVersion((version) => version + 1);
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
      if (pendingActionCountRef.current === 0) {
        setHasPendingAction(false);
      }
      setActionActivityVersion((version) => version + 1);
    },
    [applyActionActivityState],
  );

  const handleAction = useCallback((name: unknown, params: unknown) => {
    const p = resolveSnapActionParams(params, stateRef.current);
    const inputs = (stateRef.current.inputs ?? {}) as Record<string, JsonValue>;
    const h = handlersRef.current;
    let result: unknown;
    setActionPending(name, p);

    switch (name) {
      case "submit":
        result = h.submit(String(p.target ?? ""), inputs);
        break;
      case "open_url": {
        const target = validActionTarget(p.target);
        if (target) result = h.open_url(target);
        break;
      }
      case "open_snap": {
        const target = validActionTarget(p.target);
        if (target) result = h.open_snap(target);
        break;
      }
      case "open_mini_app": {
        const target = validActionTarget(p.target);
        if (target) result = h.open_mini_app(target);
        break;
      }
      case "view_cast":
        result = h.view_cast({ hash: String(p.hash ?? "") });
        break;
      case "view_profile":
        result = h.view_profile({ fid: Number(p.fid ?? 0) });
        break;
      case "view_channel":
        result = h.view_channel({ channelKey: String(p.channelKey ?? "") });
        break;
      case "compose_cast":
        result = h.compose_cast({
          text: p.text ? String(p.text) : undefined,
          channelKey: p.channelKey ? String(p.channelKey) : undefined,
          embeds: optionalSnapStringArray(p.embeds),
        });
        break;
      case "view_token":
        result = h.view_token({ token: String(p.token ?? "") });
        break;
      case "send_token":
        result = h.send_token({
          token: String(p.token ?? ""),
          amount: p.amount ? String(p.amount) : undefined,
          recipientFid: p.recipientFid ? Number(p.recipientFid) : undefined,
          recipientAddress: p.recipientAddress
            ? String(p.recipientAddress)
            : undefined,
        });
        break;
      case "swap_token":
        result = h.swap_token({
          sellToken: p.sellToken ? String(p.sellToken) : undefined,
          buyToken: p.buyToken ? String(p.buyToken) : undefined,
        });
        break;
      case "send_transaction":
        result = h.send_transaction?.({
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
  }, [setActionPending, setActionSettled]);

  const showLoadingOverlay =
    loading ||
    hasPendingAction ||
    (actionActivityVersion >= 0 && pendingActionCountRef.current > 0);

  return (
    <View
      style={styles.container}
      onStartShouldSetResponderCapture={() =>
        hasPendingSnapAction(stateRef.current)
      }
    >
      {showLoadingOverlay ? (
        loadingOverlay === undefined ? (
          <SnapLoadingOverlay appearance={mode} accentHex={accentHex} />
        ) : (
          loadingOverlay
        )
      ) : null}
      <SnapVersionProvider value={snap.version === "2.0" ? "2.0" : "1.0"}>
        <SnapCatalogView
          key={pageKey}
          spec={spec}
          store={stateStore}
          loading={false}
          onAction={handleAction}
        />
      </SnapVersionProvider>
      {showConfetti && effectRunKeys.confetti > 0 && (
        <ConfettiOverlay key={effectRunKeys.confetti} />
      )}
      {showFireworks && effectRunKeys.fireworks > 0 && (
        <FireworksOverlay key={effectRunKeys.fireworks} />
      )}
    </View>
  );
}

export function SnapLoadingOverlay({
  appearance,
  accentHex,
}: {
  appearance: "light" | "dark";
  accentHex: string;
}) {
  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor:
            appearance === "dark" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)",
        },
      ]}
    >
      <ActivityIndicator size="large" color={accentHex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
