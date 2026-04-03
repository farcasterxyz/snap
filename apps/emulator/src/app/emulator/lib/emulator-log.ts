import { SNAP_UPSTREAM_ACCEPT } from "@/lib/snapUpstreamConstants";

/** HTTP request the emulator proxy sends to the snap origin (not browser -> `/api/snap`). */
export type OutboundSnapRequestLog = {
  method: "GET" | "POST" | "CLIENT";
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type LogPairRequest = {
  title: string;
  content: string;
  /** Headers on `fetch()` from this page to `/api/snap`. */
  emulatorFetchHeaders?: Record<string, string>;
  /** Preview of proxy -> snap; replaced with `_emulatorDebug` from the API response when present. */
  outboundToSnap?: OutboundSnapRequestLog;
};

export type LogPairResponse = {
  title: string;
  content: string;
  responseStatus?: number;
  networkError?: boolean;
  /** From `Content-Type` when a `Response` was received; omitted for network failures. */
  contentType?: string | null;
  /** Authoritative proxy -> snap request from `/api/snap` (JFS-shaped JSON POST: header/payload/signature, final URL). */
  resolvedOutboundToSnap?: OutboundSnapRequestLog;
};

export type LogPair = {
  id: string;
  request: LogPairRequest;
  response: LogPairResponse | null;
};

export type PairChrome = {
  color: string;
  background: string;
  border: string;
};

/** Outer card + collapsed header: matches response status (or neutral while pending). */
export function pairChrome(pair: LogPair): PairChrome {
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

export function pairCollapsedSummary(pair: LogPair): string {
  const reqShort = pair.request.title.replace(/^Request\s+/i, "").trim();
  if (!pair.response) return `${reqShort} \u00b7 \u2026`;
  const resShort = pair.response.title.replace(/^Response\s+/i, "").trim();
  return `${reqShort} \u00b7 ${resShort}`;
}

export function createLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function snapProxyHeadersForGet(): Record<string, string> {
  return {
    Accept: SNAP_UPSTREAM_ACCEPT,
  };
}

export function snapProxyHeadersForPost(): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    Accept: SNAP_UPSTREAM_ACCEPT,
  };
}

export function formatHeaderBlock(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join("\n");
}

export function formatOutboundSnapBlock(o: OutboundSnapRequestLog): string {
  const head = formatHeaderBlock(o.headers);
  if (o.body !== undefined) {
    return `${o.method} ${o.url}\n\n${head}\n\n${o.body}`;
  }
  return `${o.method} ${o.url}\n\n${head}`;
}

export function headerMapFromDebug(
  raw: unknown,
): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const h: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") h[k] = v;
  }
  return Object.keys(h).length > 0 ? h : null;
}

/** Strip `_emulatorDebug` from logged JSON; return authoritative outbound snap request. */
export function splitEmulatorDebugForLog(parsed: unknown): {
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
export function formatEmulatorApiFailureMessage(
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

export type EmulatorFormPersisted = {
  urlInput?: string;
  fidInput?: string;
};

export const EMULATOR_FORM_STORAGE_KEY = "fc-snap-emulator:form:v1";

export function readEmulatorFormFromStorage(): EmulatorFormPersisted {
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
