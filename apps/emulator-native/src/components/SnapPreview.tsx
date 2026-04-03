import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from "react-native";
import { SnapCatalogView } from "../features/snap-catalog/catalogRenderer";
import { hexToRgba, useSnapPreviewChromePalette } from "../features/snap-catalog/useSnapPalette";
import { useTheme } from "../ThemeContext";
import { applyStatePaths } from "../lib/applyStatePaths";
import type { JsonValue, SnapPageResponse } from "../lib/snapPayload";

export function SnapPreview({
  snap,
  loading,
  onPostButton,
  onLinkButton,
}: {
  snap: SnapPageResponse;
  loading: boolean;
  onPostButton: (
    target: string,
    inputs: Record<string, unknown>,
  ) => void | Promise<void>;
  onLinkButton: (target: string) => void | Promise<void>;
}) {
  const { accentHex } = useSnapPreviewChromePalette(snap.theme?.accent);
  const { mode, colors } = useTheme();

  const frameRingStyle = useMemo(
    () => ({
      backgroundColor: "transparent",
      borderColor: "transparent",
    }),
    [],
  );

  const cardStyle = useMemo(
    () => ({
      borderColor: colors.border,
      backgroundColor: colors.surface,
    }),
    [colors.border, colors.surface],
  );

  const spec = snap.ui;
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
    const result = snapJsonRenderCatalog.validate(spec);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn(
        "[emulator-native] json-render spec validation failed",
        result.error,
      );
    }
  }, [spec]);

  const pageKey = useMemo(() => JSON.stringify(spec), [spec]);

  const onPostRef = useRef(onPostButton);
  const onLinkRef = useRef(onLinkButton);
  onPostRef.current = onPostButton;
  onLinkRef.current = onLinkButton;

  const handleAction = useCallback(async (name: unknown, params: unknown) => {
    const inputs = (stateRef.current.inputs ?? {}) as Record<string, JsonValue>;
    const p = params as Record<string, unknown> | null | undefined;
    switch (String(name)) {
      case "submit": {
        const target = String(p?.target ?? "");
        await onPostRef.current(target, inputs);
        break;
      }
      case "open_url": {
        const target = String(p?.target ?? "");
        if (target) await onLinkRef.current(target);
        break;
      }
      case "open_mini_app": {
        const url = String(p?.url ?? p?.target ?? "");
        Alert.alert("Client Action", `open_mini_app\n${url || "(no url)"}`);
        break;
      }
      case "view_cast": {
        const hash = String(p?.hash ?? "");
        Alert.alert("Client Action", `view_cast\nhash: ${hash || "(none)"}`);
        break;
      }
      case "view_profile": {
        const fid = String(p?.fid ?? "");
        Alert.alert("Client Action", `view_profile\nfid: ${fid || "(none)"}`);
        break;
      }
      case "compose_cast": {
        const text = String(p?.text ?? "");
        Alert.alert("Client Action", `compose_cast\n${text || "(no text)"}`);
        break;
      }
      case "view_token": {
        const token = String(p?.token ?? p?.address ?? "");
        Alert.alert("Client Action", `view_token\n${token || "(no token)"}`);
        break;
      }
      case "send_token": {
        const token = String(p?.token ?? p?.address ?? "");
        Alert.alert("Client Action", `send_token\n${token || "(no token)"}`);
        break;
      }
      case "swap_token": {
        const token = String(p?.token ?? p?.address ?? "");
        Alert.alert("Client Action", `swap_token\n${token || "(no token)"}`);
        break;
      }
      default:
        break;
    }
  }, []);

  return (
    <View style={[styles.frameRing, frameRingStyle]} accessibilityRole="none">
      <View style={[styles.card, cardStyle]}>
        {loading ? (
          <View
            style={[
              styles.overlay,
              { backgroundColor: mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.75)" },
            ]}
          >
            <ActivityIndicator size="large" color={accentHex} />
          </View>
        ) : null}
        <View style={styles.body}>
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
      </View>
    </View>
  );
}

const FRAME_PAD = 16;

const styles = StyleSheet.create({
  frameRing: {
    alignSelf: "stretch",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    minHeight: 120,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  body: {
    paddingHorizontal: FRAME_PAD,
    paddingVertical: FRAME_PAD,
  },
});
