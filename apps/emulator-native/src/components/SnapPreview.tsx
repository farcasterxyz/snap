import { useMemo } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  SnapView,
  type SnapActionHandlers,
  type SnapPage,
} from "@farcaster/snap/react-native";
import { useTheme } from "../ThemeContext";
import type { SnapPageResponse } from "../lib/snapPayload";

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
  const { mode, colors } = useTheme();

  const handlers = useMemo<SnapActionHandlers>(
    () => ({
      submit: (target, inputs) => {
        void onPostButton(target, inputs);
      },
      open_url: (target) => {
        if (target) void onLinkButton(target);
      },
      open_mini_app: (url) => {
        Alert.alert("Client Action", `open_mini_app\n${url || "(no url)"}`);
      },
      view_cast: ({ hash }) => {
        Alert.alert("Client Action", `view_cast\nhash: ${hash || "(none)"}`);
      },
      view_profile: ({ fid }) => {
        Alert.alert("Client Action", `view_profile\nfid: ${fid || "(none)"}`);
      },
      compose_cast: ({ text }) => {
        Alert.alert("Client Action", `compose_cast\n${text || "(no text)"}`);
      },
      view_token: ({ token }) => {
        Alert.alert("Client Action", `view_token\n${token || "(no token)"}`);
      },
      send_token: ({ token }) => {
        Alert.alert("Client Action", `send_token\n${token || "(no token)"}`);
      },
      swap_token: ({ sellToken, buyToken }) => {
        Alert.alert("Client Action", `swap_token\nsell: ${sellToken || "(none)"} buy: ${buyToken || "(none)"}`);
      },
    }),
    [onPostButton, onLinkButton],
  );

  const cardStyle = useMemo(
    () => ({
      borderColor: colors.border,
      backgroundColor: colors.surface,
    }),
    [colors.border, colors.surface],
  );

  return (
    <View style={styles.frameRing}>
      <View style={[styles.card, cardStyle]}>
        <View style={styles.body}>
          <SnapView
            snap={snap as SnapPage}
            handlers={handlers}
            loading={loading}
            appearance={mode}
            colors={colors}
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
  body: {
    paddingHorizontal: FRAME_PAD,
    paddingVertical: FRAME_PAD,
  },
});
