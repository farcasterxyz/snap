import { snapJsonRenderCatalog } from "@farcaster/snap/ui";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from "react-native";
import { SnapCatalogView } from "../features/snap-catalog/catalogRenderer";
import { hexToRgba, useSnapPreviewChromePalette } from "../features/snap-catalog/useSnapPalette";
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

  const frameRingStyle = useMemo(
    () => ({
      backgroundColor: hexToRgba(accentHex, 0.14),
      borderColor: hexToRgba(accentHex, 0.38),
      ...Platform.select({
        ios: {
          shadowColor: accentHex,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 24,
        },
        android: {
          elevation: 6,
        },
        default: {},
      }),
    }),
    [accentHex],
  );

  const cardStyle = useMemo(
    () => ({
      borderColor: hexToRgba(accentHex, 0.22),
    }),
    [accentHex],
  );

  const { spec } = snap;
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
      console.warn(
        "[emulator-native] json-render spec validation failed",
        result.error,
      );
    }
  }, [spec]);

  const pageKey = useMemo(() => JSON.stringify(spec), [spec]);

  /**
   * json-render's ActionProvider stores `handlers` in React state and only uses
   * the initial value -- so the Proxy wrapping `onAction` must stay referentially
   * stable while always invoking the latest handlers (refs).
   */
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
      case "open_mini_app":
      case "view_cast":
      case "view_profile":
      case "compose_cast":
      case "view_token":
      case "send_token":
      case "swap_token": {
        Alert.alert(
          "Native emulator",
          `${String(name)} is not implemented in this preview.`,
        );
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
          <View style={styles.overlay}>
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
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 1,
    minHeight: 120,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  body: {
    paddingHorizontal: FRAME_PAD,
    paddingVertical: FRAME_PAD,
  },
});
