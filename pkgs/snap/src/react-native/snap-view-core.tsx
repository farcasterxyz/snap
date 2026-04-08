import type { Spec } from "@json-render/core";
import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { SnapCatalogView } from "./catalog-renderer";
import { useSnapTheme } from "./theme";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  DEFAULT_THEME_ACCENT,
  PALETTE_LIGHT_HEX,
  PALETTE_DARK_HEX,
  type PaletteColor,
} from "@farcaster/snap";
import type { SnapPage, SnapActionHandlers, JsonValue } from "./types";

// ─── Shared helpers ──────────────────────────────────

export function applyStatePaths(
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
}: {
  snap: SnapPage;
  handlers: SnapActionHandlers;
  loading?: boolean;
}) {
  const { mode } = useSnapTheme();
  const spec = snap.ui;
  const accentHex = resolveAccentHex(snap.theme?.accent, mode);

  const initialState = useMemo(
    () => ({
      ...(spec.state ?? {}),
      inputs: { ...((spec.state?.inputs ?? {}) as Record<string, unknown>) },
      theme: {
        ...((spec.state?.theme ?? {}) as Record<string, unknown>),
        ...(snap.theme ? { accent: snap.theme.accent } : {}),
      },
    }),
    [spec, snap.theme],
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

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleAction = useCallback((name: unknown, params: unknown) => {
    const inputs = (stateRef.current.inputs ?? {}) as Record<string, JsonValue>;
    const p = (params ?? {}) as Record<string, unknown>;
    const h = handlersRef.current;
    switch (name) {
      case "submit":
        h.submit(String(p.target ?? ""), inputs);
        break;
      case "open_url":
        h.open_url(String(p.target ?? ""));
        break;
      case "open_mini_app":
        h.open_mini_app(String(p.target ?? ""));
        break;
      case "view_cast":
        h.view_cast({ hash: String(p.hash ?? "") });
        break;
      case "view_profile":
        h.view_profile({ fid: Number(p.fid ?? 0) });
        break;
      case "compose_cast":
        h.compose_cast({
          text: p.text ? String(p.text) : undefined,
          channelKey: p.channelKey ? String(p.channelKey) : undefined,
          embeds: Array.isArray(p.embeds) ? (p.embeds as string[]) : undefined,
        });
        break;
      case "view_token":
        h.view_token({ token: String(p.token ?? "") });
        break;
      case "send_token":
        h.send_token({
          token: String(p.token ?? ""),
          amount: p.amount ? String(p.amount) : undefined,
          recipientFid: p.recipientFid ? Number(p.recipientFid) : undefined,
          recipientAddress: p.recipientAddress
            ? String(p.recipientAddress)
            : undefined,
        });
        break;
      case "swap_token":
        h.swap_token({
          sellToken: p.sellToken ? String(p.sellToken) : undefined,
          buyToken: p.buyToken ? String(p.buyToken) : undefined,
        });
        break;
      default:
        break;
    }
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View
          style={[
            styles.overlay,
            {
              backgroundColor:
                mode === "dark" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)",
            },
          ]}
        >
          <ActivityIndicator size="large" color={accentHex} />
        </View>
      ) : null}
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
