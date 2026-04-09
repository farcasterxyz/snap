"use client";

import { useCallback, useEffect, useState } from "react";
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
    setLog((prev) => [...prev, { id: createLogId(), request, response: null }]);
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
      setSnap(load.snap);
      setCurrentSourceUrl(parsedUrl.toString());
      setActiveUrl(trimmed);
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

        if (response.ok && body && typeof body === "object" && "snap" in body) {
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

  const handlePostButton = async (
    target: string,
    inputs: Record<string, unknown>,
  ) => {
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
              <SnapRenderer
                snap={snap}
                handlers={{
                  submit: handlePostButton,
                  open_url: (target) => {
                    if (target) window.open(target, "_blank", "noopener,noreferrer");
                  },
                  open_snap: (target) => {
                    window.alert(`open_snap\n\n${target}`);
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
