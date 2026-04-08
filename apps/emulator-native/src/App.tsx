import type { SnapPayload } from "@farcaster/snap";
import { validateSnapResponse } from "@farcaster/snap";
import { encodePayload } from "@farcaster/snap/server";
import {
  SnapVM,
  decodeBytecode,
  SYSCALL,
  jsonToSnapValue,
  snapNull,
  snapString,
  snapI64,
  snapValueToJSON,
  type SnapValue,
} from "@farcaster/snap-compute";
import * as Linking from "expo-linking";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SnapPreview } from "./components/SnapPreview";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { SNAP_UPSTREAM_ACCEPT } from "./lib/snapUpstreamConstants";
import {
  coerceUpstreamUrlToMatchCurrentSnap,
  toAbsoluteSnapTarget,
} from "./lib/snapUrl";
import {
  parseSnapPayload,
  type SnapPageResponse,
  unwrapSnapResponseJsonForValidation,
} from "./lib/snapPayload";

function formatValidationIssues(
  issues: readonly { path?: PropertyKey[]; message: string }[],
): string {
  return issues
    .map((i) => {
      const p =
        i.path && i.path.length > 0
          ? i.path.map(String).join(".")
          : "(root)";
      return `${p}: ${i.message}`;
    })
    .join("\n");
}

/** Upstream may return 400 JSON `{ error, issues? }` from `payloadToResponse` (GET or POST). */
function formatUpstreamSnapFailure(
  json: unknown,
  status: number,
  method: "GET" | "POST",
): string {
  if (status === 400 && json && typeof json === "object") {
    const o = json as {
      error?: string;
      issues?: readonly { path?: PropertyKey[]; message: string }[];
    };
    if (Array.isArray(o.issues) && o.issues.length > 0) {
      const base = o.error ?? "Invalid snap page";
      return `${base}\n${formatValidationIssues(o.issues)}`;
    }
    if (typeof o.error === "string" && o.error.length > 0) {
      return o.error;
    }
  }
  return `${method} failed (${status})`;
}

function parseUserFid(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return 3;
  }
  return n;
}

/** Default example port (`examples/ui-catalog-elements` universal catalog). */
const DEFAULT_LOCAL_PORT = "3015";

const LOCAL_SNAP_ORIGIN = "http://localhost";

function parsePort(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535 || !Number.isInteger(n)) {
    return null;
  }
  return n;
}

/**
 * Port field accepts digits only, or a pasted `http://localhost:PORT` / `http://localhost: PORT` string.
 */
function coercePortInput(raw: string): string {
  const t = raw.trim();
  const fromLocalhost = t.match(/localhost\s*:\s*(\d{1,5})\b/i);
  if (fromLocalhost?.[1]) return fromLocalhost[1]!;
  return raw.replace(/\D/g, "").slice(0, 5);
}

/** Snap URL for the dev server on this machine (trailing slash). */
function snapUrlForLocalPort(port: string): string | null {
  const p = parsePort(port);
  if (p === null) return null;
  return `${LOCAL_SNAP_ORIGIN}:${p}/`;
}

/**
 * Stale preview: port digits differ from the loaded snap's origin port.
 */
function portDiffersFromLoadedLocalSnap(
  portInput: string,
  currentSourceUrl: string | null,
): boolean {
  if (!currentSourceUrl) return false;
  let loaded: URL;
  try {
    loaded = new URL(currentSourceUrl);
  } catch {
    return false;
  }
  if (loaded.hostname !== "localhost" && loaded.hostname !== "127.0.0.1") {
    return false;
  }
  const loadedPort =
    loaded.port !== ""
      ? Number.parseInt(loaded.port, 10)
      : loaded.protocol === "https:"
        ? 443
        : 80;
  const fieldPort = parsePort(portInput);
  if (fieldPort === null) return false;
  return fieldPort !== loadedPort;
}

function isComputeSnap(snap: SnapPageResponse | null): boolean {
  return snap != null && snap.compute != null && typeof snap.compute.bytecode === "string";
}

function decodeBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  return bytes;
}

function createSyscallHandler(
  fid: number,
  localStore: Record<string, unknown>,
  sharedStore: Record<string, unknown>,
): (index: number, args: SnapValue[]) => SnapValue {
  return (index, args) => {
    switch (index) {
      case SYSCALL.SELF_FID: return snapI64(BigInt(fid));
      case SYSCALL.UI_RENDER: return snapNull();
      case SYSCALL.FARCASTER_TIMESTAMP: return snapI64(BigInt(Math.floor(Date.now() / 1000) - 1609459200));
      case SYSCALL.STATE_GET: {
        const key = args[0]?.type === "string" ? args[0].value : "";
        return (localStore[key] as SnapValue) ?? snapNull();
      }
      case SYSCALL.STATE_SET: {
        const key = args[0]?.type === "string" ? args[0].value : "";
        localStore[key] = args[1];
        return snapNull();
      }
      case SYSCALL.SHARED_GET: {
        const key = args[0]?.type === "string" ? args[0].value : "";
        return (sharedStore[key] as SnapValue) ?? snapNull();
      }
      case SYSCALL.SHARED_SET: {
        const key = args[0]?.type === "string" ? args[0].value : "";
        sharedStore[key] = args[1];
        return snapNull();
      }
      case SYSCALL.SHARED_COUNT: {
        const key = args[0]?.type === "string" ? args[0].value : "";
        return snapI64(BigInt(sharedStore[key] != null ? 1 : 0));
      }
      default: return snapNull();
    }
  };
}

function AppContent() {
  const { mode, colors, toggleMode } = useTheme();
  const [portInput, setPortInput] = useState(DEFAULT_LOCAL_PORT);
  const [fidInput, setFidInput] = useState("3");
  const [snap, setSnap] = useState<SnapPageResponse | null>(null);
  const [currentSourceUrl, setCurrentSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localStateRef = useRef<Record<string, Record<string, unknown>>>({});
  const sharedStateRef = useRef<Record<string, Record<string, unknown>>>({});

  const handleLoad = useCallback(async () => {
    const url = snapUrlForLocalPort(portInput);
    if (!url) {
      setError("Enter a valid port (1-65535)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { Accept: SNAP_UPSTREAM_ACCEPT },
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        throw new Error("Response is not JSON");
      }
      if (!res.ok) {
        throw new Error(formatUpstreamSnapFailure(json, res.status, "GET"));
      }

      const toValidate = unwrapSnapResponseJsonForValidation(json);
      const validation = validateSnapResponse(toValidate);
      if (!validation.valid) {
        throw new Error(formatValidationIssues(validation.issues));
      }

      const parsed = parseSnapPayload(json);
      const snapUrl = new URL(url).href;
      setCurrentSourceUrl(snapUrl);

      if (isComputeSnap(parsed)) {
        try {
          const bytes = decodeBase64Url(parsed.compute!.bytecode);
          const mod = decodeBytecode(bytes);
          const fid = parseUserFid(fidInput);
          if (!localStateRef.current[snapUrl]) localStateRef.current[snapUrl] = {};
          if (!sharedStateRef.current[snapUrl]) sharedStateRef.current[snapUrl] = {};
          const handler = createSyscallHandler(fid, localStateRef.current[snapUrl]!, sharedStateRef.current[snapUrl]!);
          const vm = new SnapVM(mod, { gasLimit: parsed.compute!.gas_limit ?? 500000, syscallHandler: handler });
          const result = await vm.execute(parsed.compute!.entrypoint ?? "main", [snapString("get"), { type: "map", value: new Map() }, snapI64(0)]);
          if (result.success && result.renderedUi != null) {
            setSnap({ ...parsed, ui: result.renderedUi as SnapPageResponse["ui"] });
          } else {
            setSnap(parsed);
            if (result.error) setError(`VM: ${result.error}`);
          }
        } catch (vmErr) {
          setSnap(parsed);
          setError(`VM init: ${vmErr instanceof Error ? vmErr.message : String(vmErr)}`);
        }
      } else {
        setSnap(parsed);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Load failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [portInput, fidInput]);

  const handlePostButton = useCallback(
    async (
      target: string,
      inputs: Record<string, unknown>,
    ) => {
      if (!currentSourceUrl) {
        setError("Missing current source URL");
        return;
      }

      // Compute snap: run VM locally
      if (isComputeSnap(snap)) {
        setLoading(true);
        setError(null);
        try {
          const bytes = decodeBase64Url(snap!.compute!.bytecode);
          const mod = decodeBytecode(bytes);
          const fid = parseUserFid(fidInput);
          const snapUrl = currentSourceUrl;
          if (!localStateRef.current[snapUrl]) localStateRef.current[snapUrl] = {};
          if (!sharedStateRef.current[snapUrl]) sharedStateRef.current[snapUrl] = {};
          const handler = createSyscallHandler(fid, localStateRef.current[snapUrl]!, sharedStateRef.current[snapUrl]!);
          const vm = new SnapVM(mod, { gasLimit: snap!.compute!.gas_limit ?? 500000, syscallHandler: handler });
          const inputsMap = jsonToSnapValue(inputs);
          const result = await vm.execute(snap!.compute!.entrypoint ?? "main", [snapString("post"), inputsMap, snapI64(0)]);
          if (result.success && result.renderedUi != null) {
            setSnap({ ...snap!, ui: result.renderedUi as SnapPageResponse["ui"] });
          } else if (result.error) {
            setError(`VM: ${result.error}`);
          }
        } catch (vmErr) {
          setError(`VM: ${vmErr instanceof Error ? vmErr.message : String(vmErr)}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!target) target = currentSourceUrl;

      const fid = parseUserFid(fidInput);
      const timestamp = Math.floor(Date.now() / 1000);
      const payload: SnapPayload = {
        fid,
        inputs: inputs as SnapPayload["inputs"],
        button_index: 0,
        timestamp,
      };

      const nextSourceUrl = coerceUpstreamUrlToMatchCurrentSnap(
        new URL(toAbsoluteSnapTarget(currentSourceUrl, target)),
        new URL(currentSourceUrl),
      ).toString();

      setLoading(true);
      setError(null);
      try {
        const jfsEnvelope = {
          header: "dev",
          payload: encodePayload(payload),
          signature: "dev",
        };

        const res = await fetch(nextSourceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: SNAP_UPSTREAM_ACCEPT,
          },
          body: JSON.stringify(jfsEnvelope),
        });
        const text = await res.text();
        let json: unknown;
        try {
          json = JSON.parse(text) as unknown;
        } catch {
          throw new Error(
            res.ok ? "Snap response is not JSON" : `POST failed (${res.status})`,
          );
        }
        if (!res.ok) {
          throw new Error(formatUpstreamSnapFailure(json, res.status, "POST"));
        }

        const toValidate = unwrapSnapResponseJsonForValidation(json);
        const validation = validateSnapResponse(toValidate);
        if (!validation.valid) {
          throw new Error(formatValidationIssues(validation.issues));
        }

        const parsed = parseSnapPayload(json);
        setSnap(parsed);
        setCurrentSourceUrl(nextSourceUrl);
      } catch (e) {
        const message = e instanceof Error ? e.message : "POST failed";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [currentSourceUrl, fidInput, snap],
  );

  const handleLinkButton = useCallback(async (target: string) => {
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      setError("Invalid link URL");
      return;
    }
    if (parsed.protocol !== "https:") {
      setError("Only https: links are supported");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(target, {
        headers: { Accept: SNAP_UPSTREAM_ACCEPT },
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        await Linking.openURL(target);
        return;
      }
      if (!res.ok) {
        await Linking.openURL(target);
        return;
      }
      const toValidate = unwrapSnapResponseJsonForValidation(json);
      const validation = validateSnapResponse(toValidate);
      if (!validation.valid) {
        await Linking.openURL(target);
        return;
      }
      const parsedSnap = parseSnapPayload(json);
      setSnap(parsedSnap);
      setCurrentSourceUrl(target);
    } catch {
      try {
        await Linking.openURL(target);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open link");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const previewIsStale = portDiffersFromLoadedLocalSnap(
    portInput,
    currentSourceUrl,
  );
  const portValid = snapUrlForLocalPort(portInput) !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <View style={styles.layout}>
        <ScrollView
          style={styles.pageScroll}
          contentContainerStyle={styles.pageScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              Snap emulator (native)
            </Text>
            <Pressable
              style={[styles.modeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={toggleMode}
            >
              <Text style={[styles.modeToggleText, { color: colors.text }]}>
                {mode === "dark" ? "Light" : "Dark"}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Port</Text>
          <View style={[styles.portRow, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <Text style={[styles.portPrefix, { color: colors.textSecondary }]} selectable>
              {LOCAL_SNAP_ORIGIN}:
            </Text>
            <TextInput
              style={[styles.portInput, { color: colors.text }]}
              value={portInput}
              onChangeText={(t) => setPortInput(coercePortInput(t))}
              placeholder={DEFAULT_LOCAL_PORT}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={64}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>User FID</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
            value={fidInput}
            onChangeText={setFidInput}
            placeholder="e.g. 12345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />

          <Pressable
            style={({ pressed }) => [
              styles.loadBtn,
              pressed && styles.loadBtnPressed,
              (loading || !portValid) && styles.loadBtnDisabled,
            ]}
            onPress={() => void handleLoad()}
            disabled={loading || !portValid}
          >
            <Text style={styles.loadBtnText}>Load</Text>
          </Pressable>

          {previewIsStale ? (
            <Text style={styles.urlStaleHint}>
              Port changed — tap Load to fetch this snap (preview below is still
              the previous one).
            </Text>
          ) : null}

          {error && !snap ? <Text style={styles.error}>{error}</Text> : null}

          {snap ? (
            <>
              <View style={styles.previewWrap}>
                <SnapPreview
                  snap={snap}
                  loading={loading}
                  onPostButton={handlePostButton}
                  onLinkButton={handleLinkButton}
                />
              </View>
              {error ? (
                <Text style={styles.previewError}>{error}</Text>
              ) : null}
            </>
          ) : (
            <View style={styles.placeholderWrap}>
              <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
                Enter a port and tap Load ({LOCAL_SNAP_ORIGIN}
                :{DEFAULT_LOCAL_PORT}/ by default).
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layout: {
    flex: 1,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  pageScroll: { flex: 1 },
  pageScrollContent: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: "700" },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeToggleText: { fontSize: 13, fontWeight: "600" },
  hint: { fontSize: 13, marginBottom: 8 },
  hintMono: { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
  label: { fontSize: 12, fontWeight: "600" },
  portRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 44,
  },
  portPrefix: {
    fontSize: 15,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  portInput: {
    flex: 1,
    minWidth: 56,
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 15,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  loadBtn: {
    backgroundColor: "#006BFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  loadBtnPressed: { opacity: 0.9 },
  loadBtnDisabled: { opacity: 0.45 },
  loadBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  urlStaleHint: {
    fontSize: 13,
    color: "#b45309",
    marginTop: 8,
    lineHeight: 18,
  },
  error: { color: "#b91c1c", fontSize: 14, marginTop: 4 },
  previewError: {
    color: "#b91c1c",
    fontSize: 13,
    marginTop: 4,
  },
  placeholder: { fontSize: 14 },
  placeholderWrap: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  previewWrap: {
    marginTop: 8,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
