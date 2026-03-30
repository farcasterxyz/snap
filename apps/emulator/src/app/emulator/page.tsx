"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { SnapRenderer, type SnapPage } from "@/components/SnapRenderer";
import {
  coerceUpstreamUrlToMatchCurrentSnap,
  toAbsoluteSnapTarget,
} from "@/lib/snapProxyNormalize";
import { SNAP_UPSTREAM_ACCEPT } from "@/lib/snapUpstreamConstants";

/** HTTP request the emulator proxy sends to the snap origin (not browser → `/api/snap`). */
type OutboundSnapRequestLog = {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string;
};

type LogPairRequest = {
  title: string;
  content: string;
  /** Headers on `fetch()` from this page to `/api/snap`. */
  emulatorFetchHeaders?: Record<string, string>;
  /** Preview of proxy → snap; replaced with `_emulatorDebug` from the API response when present. */
  outboundToSnap?: OutboundSnapRequestLog;
};

type LogPairResponse = {
  title: string;
  content: string;
  responseStatus?: number;
  networkError?: boolean;
  /** From `Content-Type` when a `Response` was received; omitted for network failures. */
  contentType?: string | null;
  /** Authoritative proxy → snap request from `/api/snap` (JFS-shaped JSON POST: header/payload/signature, final URL). */
  resolvedOutboundToSnap?: OutboundSnapRequestLog;
};

type LogPair = {
  id: string;
  request: LogPairRequest;
  response: LogPairResponse | null;
};

/** Request/response sub-rows and JSON blocks inside a pair (neutral gray). */
const INNER_LOG_STRIP = {
  stripBackground: "var(--border)",
  preBackground: "var(--bg-hover)",
  labelColor: "var(--text-secondary)",
  copyHoverBg: "var(--bg-hover)",
} as const;

type PairChrome = {
  color: string;
  background: string;
  border: string;
};

/** Outer card + collapsed header: matches response status (or neutral while pending). */
function pairChrome(pair: LogPair): PairChrome {
  const res = pair.response;
  if (!res) {
    return {
      color: "var(--log-pending-color)",
      background: "var(--log-pending-bg)",
      border: "var(--log-pending-border)",
    };
  }
  if (res.networkError) {
    return {
      color: "var(--log-error-color)",
      background: "var(--log-error-bg)",
      border: "var(--log-error-border)",
    };
  }
  const s = res.responseStatus;
  if (s !== undefined && s >= 500) {
    return {
      color: "var(--log-error-color)",
      background: "var(--log-error-bg)",
      border: "var(--log-error-border)",
    };
  }
  if (s !== undefined && s >= 400 && s < 500) {
    return {
      color: "var(--log-warn-color)",
      background: "var(--log-warn-bg)",
      border: "var(--log-warn-border)",
    };
  }
  return {
    color: "var(--log-success-color)",
    background: "var(--log-success-bg)",
    border: "var(--log-success-border)",
  };
}

function pairCollapsedSummary(pair: LogPair): string {
  const reqShort = pair.request.title.replace(/^Request\s+/i, "").trim();
  if (!pair.response) return `${reqShort} · …`;
  const resShort = pair.response.title.replace(/^Response\s+/i, "").trim();
  return `${reqShort} · ${resShort}`;
}

function createLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function CopyIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function LogChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        flexShrink: 0,
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const EMULATOR_FORM_STORAGE_KEY = "fc-snap-emulator:form:v1";

type EmulatorFormPersisted = {
  urlInput?: string;
  fidInput?: string;
};

function snapProxyHeadersForGet(): Record<string, string> {
  return {
    Accept: SNAP_UPSTREAM_ACCEPT,
  };
}

function snapProxyHeadersForPost(): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    Accept: SNAP_UPSTREAM_ACCEPT,
  };
}

function formatHeaderBlock(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");
}

function formatOutboundSnapBlock(o: OutboundSnapRequestLog): string {
  const head = formatHeaderBlock(o.headers);
  if (o.body !== undefined) {
    return `${o.method} ${o.url}\n\n${head}\n\n${o.body}`;
  }
  return `${o.method} ${o.url}\n\n${head}`;
}

function headerMapFromDebug(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") h[k] = v;
  }
  return Object.keys(h).length > 0 ? h : null;
}

/** Strip `_emulatorDebug` from logged JSON; return authoritative outbound snap request. */
function splitEmulatorDebugForLog(parsed: unknown): {
  bodyForLog: unknown;
  resolvedOutboundToSnap?: OutboundSnapRequestLog;
} {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { bodyForLog: parsed };
  }
  const o = parsed as Record<string, unknown>;
  const dbg = o._emulatorDebug;
  if (!dbg || typeof dbg !== "object" || Array.isArray(dbg)) {
    return { bodyForLog: parsed };
  }
  const d = dbg as Record<string, unknown>;
  const headers = headerMapFromDebug(d.upstreamSnapHeaders);
  const url =
    typeof d.upstreamSnapUrl === "string" ? d.upstreamSnapUrl.trim() : "";
  const method =
    d.upstreamSnapMethod === "POST"
      ? "POST"
      : d.upstreamSnapMethod === "GET"
      ? "GET"
      : null;
  const { _emulatorDebug: _, ...rest } = o;
  if (!method || !url || !headers) {
    return { bodyForLog: rest };
  }
  const body =
    typeof d.upstreamSnapBody === "string" ? d.upstreamSnapBody : undefined;
  return {
    bodyForLog: rest,
    resolvedOutboundToSnap: { method, url, headers, body },
  };
}

/** User-visible text from `/api/snap` error JSON (includes forwarded snap upstream bodies). */
function formatEmulatorApiFailureMessage(
  body: unknown,
  httpStatus: number,
): string {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return `Request failed (${httpStatus})`;
  }
  const o = body as Record<string, unknown>;
  const lines: string[] = [];
  if (typeof o.error === "string") {
    lines.push(o.error);
  } else {
    lines.push(`Request failed (${httpStatus})`);
  }
  if (typeof o.reason === "string") {
    lines.push(`Reason: ${o.reason}`);
  }
  if (typeof o.upstreamStatus === "number") {
    lines.push(`Snap server HTTP ${o.upstreamStatus}`);
  }
  if (o.upstreamBody !== undefined) {
    lines.push(JSON.stringify(o.upstreamBody, null, 2));
  } else if (typeof o.upstreamBodyRaw === "string" && o.upstreamBodyRaw) {
    lines.push(o.upstreamBodyRaw);
  }
  if (Array.isArray(o.issues)) {
    lines.push(JSON.stringify(o.issues, null, 2));
  }
  return lines.join("\n\n");
}

function readEmulatorFormFromStorage(): EmulatorFormPersisted {
  try {
    const raw = localStorage.getItem(EMULATOR_FORM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const o = parsed as Record<string, unknown>;
    const out: EmulatorFormPersisted = {};
    if (typeof o.urlInput === "string") out.urlInput = o.urlInput;
    if (typeof o.fidInput === "string") out.fidInput = o.fidInput;
    return out;
  } catch {
    return {};
  }
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
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(
    () => new Set(),
  );
  /** `${pairId}:request` | `${pairId}:response` */
  const [copiedLogPart, setCopiedLogPart] = useState<string | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const p = readEmulatorFormFromStorage();
    if (typeof p.urlInput === "string") setUrlInput(p.urlInput);
    if (typeof p.fidInput === "string") setFidInput(p.fidInput);
    setFormHydrated(true);
  }, []);

  useEffect(() => {
    if (!formHydrated) return;
    try {
      const payload: EmulatorFormPersisted = {
        urlInput,
        fidInput,
      };
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

  const flashCopied = useCallback((partKey: string) => {
    setCopiedLogPart(partKey);
    if (copyFeedbackTimerRef.current !== null) {
      clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopiedLogPart(null);
      copyFeedbackTimerRef.current = null;
    }, 2000);
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
    setCopiedLogPart(null);
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
      title: "Emulator · GET /api/snap",
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
        response = await fetch(apiPath, {
          cache: "no-store",
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
        title: "Emulator · GET /api/snap (link → snap probe)",
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
          response = await fetch(apiPath, {
            cache: "no-store",
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
    buttonIndex: number,
    button: Record<string, unknown>,
    inputs: Record<string, unknown>,
  ) => {
    const action = String(button.action ?? "");
    if (action !== "post") {
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

    const target = String(button.target ?? currentSourceUrl);
    const nextSourceUrl = coerceUpstreamUrlToMatchCurrentSnap(
      new URL(toAbsoluteSnapTarget(currentSourceUrl, target)),
      new URL(currentSourceUrl),
    ).toString();

    setLoading(true);
    setError(null);

    const requestBody = {
      currentUrl: currentSourceUrl,
      target,
      buttonIndex,
      inputs,
      fid: fidParsed,
    };

    appendPairRequest({
      title: "Emulator · POST /api/snap",
      content: JSON.stringify(
        {
          method: "POST",
          path: "/api/snap",
          body: requestBody,
        },
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
        gridTemplateColumns: "minmax(280px, 380px) 1fr",
        gridTemplateRows: "minmax(0, 1fr)",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          borderRight: "1px solid var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        <div style={{ padding: 16, display: "grid", gap: 10, flexShrink: 0 }}>
          <label
            htmlFor="snap-url"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}
          >
            Snap URL
          </label>
          <input
            id="snap-url"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLoad();
            }}
            placeholder="https://…"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          <label
            htmlFor="snap-fid"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}
          >
            User FID
          </label>
          <input
            id="snap-fid"
            type="text"
            inputMode="numeric"
            value={fidInput}
            onChange={(e) => setFidInput(e.target.value)}
            placeholder="e.g. 12345"
            autoComplete="off"
            spellCheck={false}
            style={{
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              border: "1px solid var(--input-border)",
              background: "var(--input-bg)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          />
          <button
            type="button"
            onClick={() => void handleLoad()}
            disabled={loading || !urlInput.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: loading || !urlInput.trim() ? "var(--btn-disabled-bg)" : "var(--btn-primary-bg)",
              color: "var(--btn-primary-color)",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading || !urlInput.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading…" : "Load"}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            borderTop: "1px solid var(--border)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            background: "var(--bg-primary)",
          }}
        >
          {log.length === 0 ? (
            <p
              style={{
                margin: 8,
                fontSize: 13,
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              Request–response pairs appear here after you load a snap or tap a
              POST button.
            </p>
          ) : (
            log.map((pair) => {
              const expanded = expandedLogIds.has(pair.id);
              const reqPartKey = `${pair.id}:request`;
              const resPartKey = `${pair.id}:response`;
              const res = pair.response;
              const outboundToSnap =
                pair.response?.resolvedOutboundToSnap ??
                pair.request.outboundToSnap;
              const outboundToSnapText =
                outboundToSnap && outboundToSnap.url.trim() !== ""
                  ? formatOutboundSnapBlock(outboundToSnap)
                  : "";
              const outboundPartKey = `${pair.id}:outboundSnap`;
              const emuHdr = pair.request.emulatorFetchHeaders ?? {};
              const emulatorHeadersText =
                Object.keys(emuHdr).length > 0
                  ? formatHeaderBlock(emuHdr)
                  : "(no custom headers — browser default fetch)";
              const emulatorHeadersPartKey = `${pair.id}:emulatorHeaders`;
              const responseHeadersPartKey = `${pair.id}:responseHeaders`;
              const responseContentTypeLine =
                res && res.contentType !== undefined
                  ? formatHeaderBlock({
                      "Content-Type": res.contentType || "⟨not present⟩",
                    })
                  : "";
              const chrome = pairChrome(pair);
              const preStyle: CSSProperties = {
                margin: 0,
                padding: "6px 8px 8px",
                fontSize: 10,
                lineHeight: 1.35,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                minHeight: 100,
                maxHeight: 220,
                overflowY: "auto",
                background: INNER_LOG_STRIP.preBackground,
              };
              const innerSectionBarStyle: CSSProperties = {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "5px 8px",
                boxSizing: "border-box",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.01em",
                textTransform: "none",
                color: INNER_LOG_STRIP.labelColor,
                background: INNER_LOG_STRIP.stripBackground,
              };
              return (
                <article
                  key={pair.id}
                  style={{
                    flexShrink: 0,
                    border: `1px solid ${chrome.border}`,
                    borderRadius: 12,
                    background: chrome.background,
                    overflow: "hidden",
                  }}
                >
                  <header
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      minHeight: 34,
                      boxSizing: "border-box",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      color: chrome.color,
                      background: chrome.background,
                      borderBottom: expanded
                        ? `1px solid ${chrome.border}`
                        : "none",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLogExpanded(pair.id)}
                      aria-expanded={expanded}
                      aria-controls={`log-body-${pair.id}`}
                      id={`log-header-${pair.id}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        margin: 0,
                        padding: 0,
                        border: "none",
                        borderRadius: 6,
                        background: "transparent",
                        color: "inherit",
                        font: "inherit",
                        letterSpacing: "inherit",
                        textTransform: "inherit",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <LogChevron expanded={expanded} />
                      <span style={{ minWidth: 0, lineHeight: 1.3 }}>
                        {pairCollapsedSummary(pair)}
                      </span>
                    </button>
                  </header>
                  {expanded ? (
                    <div
                      id={`log-body-${pair.id}`}
                      role="region"
                      aria-labelledby={`log-header-${pair.id}`}
                    >
                      {outboundToSnapText ? (
                        <div
                          style={{
                            borderBottom: "1px solid rgba(17, 24, 39, 0.08)",
                          }}
                        >
                          <div style={innerSectionBarStyle}>
                            <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                              Snap server (proxy outbound request)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  const ok = await copyToClipboard(
                                    outboundToSnapText,
                                  );
                                  if (!ok) return;
                                  flashCopied(outboundPartKey);
                                })();
                              }}
                              aria-label={
                                copiedLogPart === outboundPartKey
                                  ? "Copied snap server request"
                                  : "Copy snap server request"
                              }
                              title={
                                copiedLogPart === outboundPartKey
                                  ? "Copied to clipboard"
                                  : "Copy snap server request"
                              }
                              style={{
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: copiedLogPart === outboundPartKey ? 4 : 0,
                                margin: 0,
                                padding:
                                  copiedLogPart === outboundPartKey
                                    ? "2px 6px"
                                    : 2,
                                border: "none",
                                borderRadius: 6,
                                background: "transparent",
                                color:
                                  copiedLogPart === outboundPartKey
                                    ? "var(--green-text)"
                                    : "inherit",
                                cursor: "pointer",
                                opacity:
                                  copiedLogPart === outboundPartKey ? 1 : 0.75,
                              }}
                              onMouseEnter={(e) => {
                                if (copiedLogPart === outboundPartKey) return;
                                e.currentTarget.style.opacity = "1";
                                e.currentTarget.style.background =
                                  INNER_LOG_STRIP.copyHoverBg;
                              }}
                              onMouseLeave={(e) => {
                                if (copiedLogPart === outboundPartKey) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  return;
                                }
                                e.currentTarget.style.opacity = "0.75";
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              {copiedLogPart === outboundPartKey ? (
                                <>
                                  <CheckIcon />
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.03em",
                                      lineHeight: 1,
                                    }}
                                  >
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <CopyIcon />
                              )}
                            </button>
                          </div>
                          <pre
                            style={{
                              ...preStyle,
                              minHeight: 0,
                              maxHeight: 280,
                            }}
                          >
                            {outboundToSnapText}
                          </pre>
                        </div>
                      ) : null}
                      <div
                        style={{
                          borderBottom: res
                            ? "1px solid rgba(17, 24, 39, 0.08)"
                            : undefined,
                        }}
                      >
                        <div style={innerSectionBarStyle}>
                          <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                            Emulator API (this page → /api/snap) · headers
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                const ok = await copyToClipboard(
                                  emulatorHeadersText,
                                );
                                if (!ok) return;
                                flashCopied(emulatorHeadersPartKey);
                              })();
                            }}
                            aria-label={
                              copiedLogPart === emulatorHeadersPartKey
                                ? "Copied emulator request headers"
                                : "Copy emulator request headers"
                            }
                            title={
                              copiedLogPart === emulatorHeadersPartKey
                                ? "Copied to clipboard"
                                : "Copy emulator request headers"
                            }
                            style={{
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap:
                                copiedLogPart === emulatorHeadersPartKey
                                  ? 4
                                  : 0,
                              margin: 0,
                              padding:
                                copiedLogPart === emulatorHeadersPartKey
                                  ? "2px 6px"
                                  : 2,
                              border: "none",
                              borderRadius: 6,
                              background: "transparent",
                              color:
                                copiedLogPart === emulatorHeadersPartKey
                                  ? "var(--green-text)"
                                  : "inherit",
                              cursor: "pointer",
                              opacity:
                                copiedLogPart === emulatorHeadersPartKey
                                  ? 1
                                  : 0.75,
                            }}
                            onMouseEnter={(e) => {
                              if (copiedLogPart === emulatorHeadersPartKey)
                                return;
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.background =
                                INNER_LOG_STRIP.copyHoverBg;
                            }}
                            onMouseLeave={(e) => {
                              if (copiedLogPart === emulatorHeadersPartKey) {
                                e.currentTarget.style.background =
                                  "transparent";
                                return;
                              }
                              e.currentTarget.style.opacity = "0.75";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {copiedLogPart === emulatorHeadersPartKey ? (
                              <>
                                <CheckIcon />
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.03em",
                                    lineHeight: 1,
                                  }}
                                >
                                  Copied
                                </span>
                              </>
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </div>
                        <pre
                          style={{
                            ...preStyle,
                            minHeight: 0,
                            maxHeight: 100,
                            borderBottom: "1px solid rgba(17, 24, 39, 0.08)",
                          }}
                        >
                          {emulatorHeadersText}
                        </pre>
                        <div style={innerSectionBarStyle}>
                          <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                            Emulator API · body (JSON)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                const ok = await copyToClipboard(
                                  pair.request.content,
                                );
                                if (!ok) return;
                                flashCopied(reqPartKey);
                              })();
                            }}
                            aria-label={
                              copiedLogPart === reqPartKey
                                ? "Copied emulator request body"
                                : "Copy emulator request body"
                            }
                            title={
                              copiedLogPart === reqPartKey
                                ? "Copied to clipboard"
                                : "Copy emulator request body"
                            }
                            style={{
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: copiedLogPart === reqPartKey ? 4 : 0,
                              margin: 0,
                              padding:
                                copiedLogPart === reqPartKey ? "2px 6px" : 2,
                              border: "none",
                              borderRadius: 6,
                              background: "transparent",
                              color:
                                copiedLogPart === reqPartKey
                                  ? "var(--green-text)"
                                  : "inherit",
                              cursor: "pointer",
                              opacity: copiedLogPart === reqPartKey ? 1 : 0.75,
                            }}
                            onMouseEnter={(e) => {
                              if (copiedLogPart === reqPartKey) return;
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.background =
                                INNER_LOG_STRIP.copyHoverBg;
                            }}
                            onMouseLeave={(e) => {
                              if (copiedLogPart === reqPartKey) {
                                e.currentTarget.style.background =
                                  "transparent";
                                return;
                              }
                              e.currentTarget.style.opacity = "0.75";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {copiedLogPart === reqPartKey ? (
                              <>
                                <CheckIcon />
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.03em",
                                    lineHeight: 1,
                                  }}
                                >
                                  Copied
                                </span>
                              </>
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </div>
                        <pre style={preStyle}>{pair.request.content}</pre>
                      </div>
                      {res ? (
                        <div>
                          {res.contentType !== undefined ? (
                            <div
                              style={{
                                borderBottom:
                                  "1px solid rgba(17, 24, 39, 0.08)",
                              }}
                            >
                              <div style={innerSectionBarStyle}>
                                <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                                  response headers
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    void (async () => {
                                      const ok = await copyToClipboard(
                                        responseContentTypeLine,
                                      );
                                      if (!ok) return;
                                      flashCopied(responseHeadersPartKey);
                                    })();
                                  }}
                                  aria-label={
                                    copiedLogPart === responseHeadersPartKey
                                      ? "Copied response headers"
                                      : "Copy response headers"
                                  }
                                  title={
                                    copiedLogPart === responseHeadersPartKey
                                      ? "Copied to clipboard"
                                      : "Copy response headers"
                                  }
                                  style={{
                                    flexShrink: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap:
                                      copiedLogPart === responseHeadersPartKey
                                        ? 4
                                        : 0,
                                    margin: 0,
                                    padding:
                                      copiedLogPart === responseHeadersPartKey
                                        ? "2px 6px"
                                        : 2,
                                    border: "none",
                                    borderRadius: 6,
                                    background: "transparent",
                                    color:
                                      copiedLogPart === responseHeadersPartKey
                                        ? "var(--green-text)"
                                        : "inherit",
                                    cursor: "pointer",
                                    opacity:
                                      copiedLogPart === responseHeadersPartKey
                                        ? 1
                                        : 0.75,
                                  }}
                                  onMouseEnter={(e) => {
                                    if (
                                      copiedLogPart === responseHeadersPartKey
                                    )
                                      return;
                                    e.currentTarget.style.opacity = "1";
                                    e.currentTarget.style.background =
                                      INNER_LOG_STRIP.copyHoverBg;
                                  }}
                                  onMouseLeave={(e) => {
                                    if (
                                      copiedLogPart === responseHeadersPartKey
                                    ) {
                                      e.currentTarget.style.background =
                                        "transparent";
                                      return;
                                    }
                                    e.currentTarget.style.opacity = "0.75";
                                    e.currentTarget.style.background =
                                      "transparent";
                                  }}
                                >
                                  {copiedLogPart === responseHeadersPartKey ? (
                                    <>
                                      <CheckIcon />
                                      <span
                                        style={{
                                          fontSize: 10,
                                          fontWeight: 700,
                                          letterSpacing: "0.03em",
                                          lineHeight: 1,
                                        }}
                                      >
                                        Copied
                                      </span>
                                    </>
                                  ) : (
                                    <CopyIcon />
                                  )}
                                </button>
                              </div>
                              <pre
                                style={{
                                  ...preStyle,
                                  minHeight: 0,
                                  maxHeight: 80,
                                }}
                              >
                                {responseContentTypeLine}
                              </pre>
                            </div>
                          ) : null}
                          <div style={innerSectionBarStyle}>
                            <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                              response
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  const ok = await copyToClipboard(res.content);
                                  if (!ok) return;
                                  flashCopied(resPartKey);
                                })();
                              }}
                              aria-label={
                                copiedLogPart === resPartKey
                                  ? "Copied response body"
                                  : "Copy response body"
                              }
                              title={
                                copiedLogPart === resPartKey
                                  ? "Copied to clipboard"
                                  : "Copy response body"
                              }
                              style={{
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: copiedLogPart === resPartKey ? 4 : 0,
                                margin: 0,
                                padding:
                                  copiedLogPart === resPartKey ? "2px 6px" : 2,
                                border: "none",
                                borderRadius: 6,
                                background: "transparent",
                                color:
                                  copiedLogPart === resPartKey
                                    ? "var(--green-text)"
                                    : "inherit",
                                cursor: "pointer",
                                opacity:
                                  copiedLogPart === resPartKey ? 1 : 0.75,
                              }}
                              onMouseEnter={(e) => {
                                if (copiedLogPart === resPartKey) return;
                                e.currentTarget.style.opacity = "1";
                                e.currentTarget.style.background =
                                  INNER_LOG_STRIP.copyHoverBg;
                              }}
                              onMouseLeave={(e) => {
                                if (copiedLogPart === resPartKey) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  return;
                                }
                                e.currentTarget.style.opacity = "0.75";
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              {copiedLogPart === resPartKey ? (
                                <>
                                  <CheckIcon />
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.03em",
                                      lineHeight: 1,
                                    }}
                                  >
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <CopyIcon />
                              )}
                            </button>
                          </div>
                          <pre style={preStyle}>{res.content}</pre>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "6px 8px 8px",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          Waiting for response…
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </aside>

      <main
        style={{
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: 24,
          gap: 16,
        }}
      >
        <section
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            placeItems: "center",
            alignContent: "center",
            overflowY: "auto",
            overflowX: "hidden",
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--emu-preview-bg)",
            padding: 20,
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
                justifySelf: "stretch",
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
                placeItems: "center",
              }}
            >
              <SnapRenderer
                snap={snap}
                onPostButton={handlePostButton}
                onLinkButton={handleLinkButton}
                loading={loading}
              />
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {activeUrl ? `Loaded: ${activeUrl}` : ""}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Load a snap URL to render it here.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
