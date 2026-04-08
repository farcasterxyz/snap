"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SnapRenderer, type SnapPage } from "@/components/SnapRenderer";
import {
  coerceUpstreamUrlToMatchCurrentSnap,
  toAbsoluteSnapTarget,
} from "@/lib/snapProxyNormalize";
import {
  type LogPair,
  type LogPairRequest,
  type LogPairResponse,
  createLogId,
  snapProxyHeadersForGet,
  snapProxyHeadersForPost,
  splitEmulatorDebugForLog,
  formatEmulatorApiFailureMessage,
  readEmulatorFormFromStorage,
  EMULATOR_FORM_STORAGE_KEY,
  type EmulatorFormPersisted,
} from "./lib/emulator-log";
import { EmulatorForm } from "./components/emulator-form";
import { ExchangeLog } from "./components/exchange-log";
import { SpecViewer } from "./components/spec-viewer";

/** Check if a snap has an embedded compute program. */
function isComputeSnap(snap: SnapPage | null): boolean {
  return snap != null && snap.compute != null && typeof snap.compute.bytecode === "string";
}

export default function EmulatorPage() {
  const [urlInput, setUrlInput] = useState("");
  const [fidInput, setFidInput] = useState("");
  const [formHydrated, setFormHydrated] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [snap, setSnap] = useState<SnapPage | null>(null);
  const [currentSourceUrl, setCurrentSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogPair[]>([]);
  // Compute snap state (in-memory, keyed by snap URL) — refs for synchronous access
  const localStateRef = useRef<Record<string, Record<string, unknown>>>({});
  const sharedStateRef = useRef<Record<string, Record<string, unknown>>>({});
  // Capability approval tracking (keyed by snap URL)
  const [approvedCapabilities, setApprovedCapabilities] = useState<Record<string, string[]>>({});
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const p = readEmulatorFormFromStorage();
    if (typeof p.urlInput === "string") setUrlInput(p.urlInput);
    if (typeof p.fidInput === "string") setFidInput(p.fidInput);
    setFormHydrated(true);
  }, []);

  useEffect(() => {
    if (!formHydrated) return;
    try {
      const payload: EmulatorFormPersisted = { urlInput, fidInput };
      localStorage.setItem(EMULATOR_FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota / private mode
    }
  }, [formHydrated, urlInput, fidInput]);

  const appendPairRequest = useCallback((request: LogPairRequest) => {
    setLog((prev) => [
      ...prev,
      { id: createLogId(), request, response: null },
    ]);
  }, []);

  const completePairResponse = useCallback((response: LogPairResponse) => {
    setLog((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: createLogId(),
            request: {
              title: "Request",
              content: "{}",
              emulatorFetchHeaders: {},
            },
            response,
          },
        ];
      }
      const next = [...prev];
      const last = next[next.length - 1]!;
      if (last.response === null) {
        next[next.length - 1] = { ...last, response };
      } else {
        next.push({
          id: createLogId(),
          request: {
            title: "Request",
            content: "{}",
            emulatorFetchHeaders: {},
          },
          response,
        });
      }
      return next;
    });
  }, []);

  const toggleLogExpanded = useCallback((id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const parseUrlOrError = (raw: string): URL | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return null;
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setError("Invalid URL");
      return null;
    }
    if (!/^https?:$/i.test(parsed.protocol)) {
      setError("URL must start with http:// or https://");
      return null;
    }
    return parsed;
  };

  const logResponseFromFetch = useCallback(
    async (response: Response) => {
      const contentType = response.headers.get("Content-Type");
      const text = await response.text();
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { _note: "Response was not JSON", raw: text };
      }
      const { bodyForLog, resolvedOutboundToSnap } =
        splitEmulatorDebugForLog(parsed);
      completePairResponse({
        title: `Response ${response.status}`,
        content: JSON.stringify(bodyForLog, null, 2),
        responseStatus: response.status,
        contentType,
        resolvedOutboundToSnap,
      });
      return parsed;
    },
    [completePairResponse],
  );

  const handleLoad = async () => {
    setLog([]);
    setExpandedLogIds(new Set());
    const parsedUrl = parseUrlOrError(urlInput);
    if (!parsedUrl) {
      setSnap(null);
      setCurrentSourceUrl(null);
      setActiveUrl(null);
      return;
    }

    const trimmed = urlInput.trim();
    setLoading(true);
    setError(null);

    const apiPath = `/api/snap?url=${encodeURIComponent(trimmed)}`;
    const upstreamSnapUrl = parsedUrl.toString();
    appendPairRequest({
      title: "Emulator \u00b7 GET /api/snap",
      content: JSON.stringify(
        { method: "GET", path: "/api/snap", query: { url: trimmed } },
        null,
        2,
      ),
      emulatorFetchHeaders: {},
      outboundToSnap: {
        method: "GET",
        url: upstreamSnapUrl,
        headers: snapProxyHeadersForGet(),
      },
    });

    try {
      let response: Response;
      try {
        response = await fetch(apiPath, { cache: "no-store" });
      } catch (fetchErr) {
        completePairResponse({
          title: "Response (network error)",
          content: JSON.stringify(
            {
              error:
                fetchErr instanceof Error
                  ? fetchErr.message
                  : "Request failed before a response was received",
            },
            null,
            2,
          ),
          networkError: true,
        });
        throw fetchErr;
      }

      const body = await logResponseFromFetch(response);

      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("snap" in body)
      ) {
        throw new Error(formatEmulatorApiFailureMessage(body, response.status));
      }

      const load = body as { snap: SnapPage };
      setCurrentSourceUrl(parsedUrl.toString());
      setActiveUrl(trimmed);

      // If this is a compute snap, run the VM for the initial "get" render
      if (isComputeSnap(load.snap)) {
        try {
          const { SnapVM, decodeBytecode, SYSCALL } =
            await import("@farcaster/snap-compute");

          const bytecodeStr = load.snap.compute!.bytecode;
          const binaryStr = atob(bytecodeStr.replace(/-/g, "+").replace(/_/g, "/"));
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

          const mod = decodeBytecode(bytes);
          const fidParsed = Number.parseInt(fidInput.trim(), 10) || 0;
          const snapUrl = parsedUrl.toString();

          const vm = new SnapVM(mod, {
            gasLimit: load.snap.compute!.gas_limit ?? 500000,
            syscallHandler: (index: number, args: unknown[]) => {
              const store = localStateRef.current[snapUrl] ?? {};
              if (index === SYSCALL.SELF_FID) return { type: "i64" as const, value: BigInt(fidParsed) };
              if (index === SYSCALL.STATE_GET) {
                const key = (args[0] as any)?.value;
                return (store[key] as any) ?? { type: "null" as const };
              }
              if (index === SYSCALL.STATE_SET) {
                const key = (args[0] as any)?.value;
                if (!localStateRef.current[snapUrl]) localStateRef.current[snapUrl] = {};
                localStateRef.current[snapUrl][key] = args[1];
                return { type: "null" as const };
              }
              if (index === SYSCALL.UI_RENDER) return { type: "null" as const };
              if (index === SYSCALL.FARCASTER_TIMESTAMP) return { type: "i64" as const, value: BigInt(Math.floor(Date.now() / 1000) - 1609459200) };
              return { type: "null" as const };
            },
          });

          const entrypoint = load.snap.compute!.entrypoint ?? "main";
          const result = await vm.execute(entrypoint, [
            { type: "string", value: "get" },
            { type: "map", value: new Map() },
            { type: "i64", value: BigInt(0) },
          ]);

          if (result.success && result.renderedUi != null) {
            setSnap({ ...load.snap, ui: result.renderedUi as SnapPage["ui"] });
          } else {
            setSnap(load.snap);
            if (result.error) setError(`VM init error: ${result.error}`);
          }
        } catch (vmErr) {
          setSnap(load.snap);
          setError(`VM init failed: ${vmErr instanceof Error ? vmErr.message : String(vmErr)}`);
        }
      } else {
        setSnap(load.snap);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setSnap(null);
      setCurrentSourceUrl(null);
      setActiveUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkButton = useCallback(
    async (target: string) => {
      const rawTarget = String(target ?? "").trim();
      if (!rawTarget) return;

      let absoluteUrl: string;
      try {
        if (currentSourceUrl) {
          absoluteUrl = coerceUpstreamUrlToMatchCurrentSnap(
            new URL(toAbsoluteSnapTarget(currentSourceUrl, rawTarget)),
            new URL(currentSourceUrl),
          ).toString();
        } else {
          absoluteUrl = new URL(rawTarget).toString();
        }
      } catch {
        if (typeof window !== "undefined") {
          window.open(rawTarget, "_blank", "noopener,noreferrer");
        }
        return;
      }

      setLoading(true);
      setError(null);

      const apiPath = `/api/snap?url=${encodeURIComponent(absoluteUrl)}`;
      appendPairRequest({
        title: "Emulator \u00b7 GET /api/snap (link \u2192 snap probe)",
        content: JSON.stringify(
          { method: "GET", path: "/api/snap", query: { url: absoluteUrl } },
          null,
          2,
        ),
        emulatorFetchHeaders: {},
        outboundToSnap: {
          method: "GET",
          url: absoluteUrl,
          headers: snapProxyHeadersForGet(),
        },
      });

      try {
        let response: Response;
        try {
          response = await fetch(apiPath, { cache: "no-store" });
        } catch (fetchErr) {
          completePairResponse({
            title: "Response (network error)",
            content: JSON.stringify(
              {
                error:
                  fetchErr instanceof Error
                    ? fetchErr.message
                    : "Request failed before a response was received",
              },
              null,
              2,
            ),
            networkError: true,
          });
          throw fetchErr;
        }

        const body = await logResponseFromFetch(response);

        if (
          response.ok &&
          body &&
          typeof body === "object" &&
          "snap" in body
        ) {
          const load = body as { snap: SnapPage };
          setSnap(load.snap);
          setCurrentSourceUrl(absoluteUrl);
          setUrlInput(absoluteUrl);
          setActiveUrl(absoluteUrl);
          return;
        }

        if (typeof window !== "undefined") {
          window.open(absoluteUrl, "_blank", "noopener,noreferrer");
        }
      } catch {
        if (typeof window !== "undefined") {
          window.open(absoluteUrl, "_blank", "noopener,noreferrer");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      currentSourceUrl,
      appendPairRequest,
      completePairResponse,
      logResponseFromFetch,
    ],
  );

  /**
   * Handle button press for compute snaps — execute the VM locally instead of
   * POSTing to a server. Checks capability approval before execution.
   */
  const handleComputeSubmit = async (
    inputs: Record<string, unknown>,
  ) => {
    if (!snap?.compute) { console.log("[SnapCompute] no compute field"); return; }
    const snapUrl = currentSourceUrl ?? "";
    const fidParsed = Number.parseInt(fidInput.trim(), 10) || 0;
    console.log("[SnapCompute] executing VM", { snapUrl, fid: fidParsed, localState: localStateRef.current[snapUrl] });

    // Check capability approval — state operations are implicit,
    // only protocol message emissions require explicit user approval
    const declaredCaps = snap.compute.capabilities ?? [];
    const needsApproval = declaredCaps.filter(
      (c: string) => c !== "user_state" && c !== "shared_state"
    );
    if (needsApproval.length > 0 && !approvedCapabilities[snapUrl]) {
      const approved = window.confirm(
        `This snap requests permission to:\n\n` +
        needsApproval.map((c: string) => `  - ${c}`).join("\n") +
        `\n\nApprove?`
      );
      if (!approved) {
        setError("Capabilities not approved");
        return;
      }
      setApprovedCapabilities((prev) => ({ ...prev, [snapUrl]: declaredCaps }));
    }

    appendPairRequest({
      title: "Emulator \u00b7 VM Execute (local)",
      content: JSON.stringify(
        { action: "post", fid: fidParsed, inputs, button_index: 0, capabilities: declaredCaps },
        null,
        2,
      ),
      emulatorFetchHeaders: {},
    });

    try {
      const { SnapVM, decodeBytecode, SYSCALL } =
        await import("@farcaster/snap-compute");

      const bytecodeStr = snap.compute.bytecode;
      const binaryStr = atob(bytecodeStr.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      const mod = decodeBytecode(bytes);

      const vm = new SnapVM(mod, {
        gasLimit: snap.compute.gas_limit ?? 500000,
        maxStackDepth: 1024,
        maxCallDepth: 64,
        syscallHandler: (index: number, args: unknown[]) => {
          const lStore = localStateRef.current[snapUrl] ?? {};
          const sStore = sharedStateRef.current[snapUrl] ?? {};
          switch (index) {
            case SYSCALL.SELF_FID:
              return { type: "i64", value: BigInt(fidParsed) };
            case SYSCALL.UI_RENDER:
              return { type: "null" };
            case SYSCALL.STATE_GET: {
              const key = (args[0] as any)?.value;
              return (lStore[key] as any) ?? { type: "null" };
            }
            case SYSCALL.STATE_SET: {
              const key = (args[0] as any)?.value;
              if (!localStateRef.current[snapUrl]) localStateRef.current[snapUrl] = {};
              localStateRef.current[snapUrl][key] = args[1];
              return { type: "null" };
            }
            case SYSCALL.SHARED_GET: {
              const key = (args[0] as any)?.value;
              return (sStore[key] as any) ?? { type: "null" };
            }
            case SYSCALL.SHARED_SET: {
              const key = (args[0] as any)?.value;
              if (!sharedStateRef.current[snapUrl]) sharedStateRef.current[snapUrl] = {};
              sharedStateRef.current[snapUrl][key] = args[1];
              return { type: "null" };
            }
            case SYSCALL.SHARED_COUNT: {
              const key = (args[0] as any)?.value;
              return { type: "i64", value: BigInt(sStore[key] != null ? 1 : 0) };
            }
            case SYSCALL.FARCASTER_TIMESTAMP:
              return { type: "i64", value: BigInt(Math.floor(Date.now() / 1000) - 1609459200) };
            case SYSCALL.EMIT_CAST:
            case SYSCALL.EMIT_REACT:
            case SYSCALL.EMIT_UNREACT:
            case SYSCALL.EMIT_FOLLOW:
            case SYSCALL.EMIT_UNFOLLOW:
            case SYSCALL.EMIT_USER_DATA:
              return { type: "null" };
            default:
              return { type: "null" };
          }
        },
      });

      const entrypoint = snap.compute.entrypoint ?? "main";
      // Convert inputs to a SnapValue map
      const { jsonToSnapValue } = await import("@farcaster/snap-compute");
      const inputsMap = jsonToSnapValue(inputs);

      const result = await vm.execute(entrypoint, [
        { type: "string", value: "post" },
        inputsMap,
        { type: "i64", value: BigInt(0) },
      ]);

      console.log("[SnapCompute] VM result", { success: result.success, error: result.error, gasUsed: result.gasUsed, hasUi: result.renderedUi != null, stateWrites: result.userStateWrites.length, localStateAfter: localStateRef.current[snapUrl] });

      if (result.success && result.renderedUi != null) {
        setSnap({ ...snap, ui: result.renderedUi as SnapPage["ui"] });

        // Surface the full execution output log
        const bundle: Record<string, unknown> = {
          gasUsed: result.gasUsed,
          ui: result.renderedUi,
        };
        if (result.userStateWrites.length > 0) {
          bundle.userStateWrites = result.userStateWrites.map((w) => ({
            key: w.key,
            value: new TextDecoder().decode(w.value),
          }));
        }
        if (result.sharedStateWrites.length > 0) {
          bundle.sharedStateWrites = result.sharedStateWrites.map((w) => ({
            key: w.key,
            value: new TextDecoder().decode(w.value),
          }));
        }
        if (result.emittedMessages.length > 0) {
          bundle.emittedMessages = result.emittedMessages.map((m) => ({
            type: m.type,
            args: m.args.map((a: any) => a.type === "i64" ? Number(a.value) : a.value ?? null),
          }));
        }

        completePairResponse({
          title: `VM Result (${result.gasUsed} gas)`,
          content: JSON.stringify(bundle, null, 2),
          responseStatus: 200,
        });
      } else {
        completePairResponse({
          title: "VM Error",
          content: JSON.stringify({ error: result.error, gasUsed: result.gasUsed }, null, 2),
          responseStatus: 500,
        });
        setError(result.error ?? "VM execution failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "VM execution error";
      completePairResponse({
        title: "VM Error",
        content: JSON.stringify({ error: message }, null, 2),
        responseStatus: 500,
      });
      setError(message);
    }
  };

  const handlePostButton = async (
    target: string,
    inputs: Record<string, unknown>,
  ) => {
    // If this is a compute snap, run the VM locally instead of POSTing
    if (isComputeSnap(snap)) {
      console.log("[SnapCompute] handlePostButton → compute submit", { inputs, snapCompute: !!snap?.compute });
      await handleComputeSubmit(inputs);
      return;
    }
    if (!currentSourceUrl) {
      setError("Missing current source URL");
      return;
    }

    const fidParsed = Number.parseInt(fidInput.trim(), 10);
    if (
      !Number.isFinite(fidParsed) ||
      fidParsed < 0 ||
      !Number.isInteger(fidParsed)
    ) {
      setError("User FID must be a non-negative integer");
      return;
    }

    if (!target) target = currentSourceUrl;
    const nextSourceUrl = coerceUpstreamUrlToMatchCurrentSnap(
      new URL(toAbsoluteSnapTarget(currentSourceUrl, target)),
      new URL(currentSourceUrl),
    ).toString();

    setLoading(true);
    setError(null);

    const requestBody = {
      currentUrl: currentSourceUrl,
      target,
      button_index: 0,
      inputs,
      fid: fidParsed,
    };

    appendPairRequest({
      title: "Emulator \u00b7 POST /api/snap",
      content: JSON.stringify(
        { method: "POST", path: "/api/snap", body: requestBody },
        null,
        2,
      ),
      emulatorFetchHeaders: { "Content-Type": "application/json" },
      outboundToSnap: {
        method: "POST",
        url: nextSourceUrl,
        headers: snapProxyHeadersForPost(),
      },
    });

    try {
      let response: Response;
      try {
        response = await fetch("/api/snap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchErr) {
        completePairResponse({
          title: "Response (network error)",
          content: JSON.stringify(
            {
              error:
                fetchErr instanceof Error
                  ? fetchErr.message
                  : "Request failed before a response was received",
            },
            null,
            2,
          ),
          networkError: true,
        });
        throw fetchErr;
      }

      const body = await logResponseFromFetch(response);

      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("snap" in body)
      ) {
        throw new Error(formatEmulatorApiFailureMessage(body, response.status));
      }

      const load = body as { snap: SnapPage };
      setSnap(load.snap);
      setCurrentSourceUrl(nextSourceUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "1fr",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Top bar: form */}
      <EmulatorForm
        urlInput={urlInput}
        onUrlChange={setUrlInput}
        fidInput={fidInput}
        onFidChange={setFidInput}
        onLoad={() => void handleLoad()}
        loading={loading}
      />

      {/* Main: two columns — left (snap + log) | right (spec) */}
      <div
        style={{
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
        }}
      >
        {/* Left: snap (fixed top) + log (scrollable bottom) */}
        <section
          style={{
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* Snap preview — scrolls internally if too tall, takes at most 60% */}
          <div
            style={{
              maxHeight: "60%",
              overflowY: "auto",
              padding: 20,
              background: "var(--emu-preview-bg)",
            }}
          >
            {error ? (
              <div
                style={{
                  color: "var(--log-error-color)",
                  fontWeight: 600,
                  whiteSpace: "pre-wrap",
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 12,
                  maxWidth: "100%",
                  textAlign: "left",
                }}
              >
                {error}
              </div>
            ) : snap ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  width: "100%",
                  maxWidth: 480,
                  minWidth: 0,
                }}
              >
                {isComputeSnap(snap) && (
                  <div
                    style={{
                      padding: "6px 12px",
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#a78bfa",
                      fontFamily: "monospace",
                    }}
                  >
                    Snap Compute enabled — interactions execute locally via SnapVM
                  </div>
                )}
                <SnapRenderer
                  snap={snap}
                  handlers={{
                    submit: handlePostButton,
                    open_url: (target) => {
                      if (target) window.open(target, "_blank", "noopener,noreferrer");
                    },
                    open_mini_app: (target) => {
                      window.alert(`open_mini_app\n\n${target}`);
                    },
                    view_cast: (params) => {
                      window.alert(
                        `view_cast\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                    view_profile: (params) => {
                      window.alert(
                        `view_profile\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                    compose_cast: (params) => {
                      window.alert(
                        `compose_cast\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                    view_token: (params) => {
                      window.alert(
                        `view_token\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                    send_token: (params) => {
                      window.alert(
                        `send_token\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                    swap_token: (params) => {
                      window.alert(
                        `swap_token\n\n${JSON.stringify(params, null, 2)}`,
                      );
                    },
                  }}
                  loading={loading}
                />
              </div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Load a snap URL to render it here.
              </div>
            )}
          </div>

          {/* Log — scrolls independently */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-surface)",
            }}
          >
            {log.length > 0 ? (
              <div style={{ padding: "12px 20px 20px" }}>
                <ExchangeLog
                  log={log}
                  expandedLogIds={expandedLogIds}
                  onToggleExpand={toggleLogExpanded}
                />
              </div>
            ) : (
              <div
                style={{
                  padding: 20,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                Exchange log will appear here.
              </div>
            )}
          </div>
        </section>

        {/* Right: spec viewer */}
        <section
          style={{
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <SpecViewer data={(snap as Record<string, unknown> | null) ?? null} />
        </section>
      </div>
    </div>
  );
}
