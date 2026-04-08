export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapCompute = {
  bytecode: string;              // base64url-encoded SnapVM bytecode
  entrypoint?: string;           // default "main"
  gas_limit?: number;            // default 500000
  exports?: string[];
  state_schema?: Record<string, string>;
};

export type SnapPageResponse = {
  version: string;
  theme?: { accent?: string };
  effects?: string[];
  compute?: SnapCompute;
  ui: {
    root: string;
    elements: Record<string, Record<string, JsonValue>>;
    state?: Record<string, JsonValue>;
  };
};

/**
 * Snap buttons often use absolute URLs from `SNAP_PUBLIC_BASE_URL` (e.g. https in
 * production) while local dev serves the same host:port over http. When the proxy
 * already reached the snap via `currentSnapUrl`, reuse that scheme so POST does not
 * call `fetch` with a scheme the upstream is not serving.
 */
export function coerceUpstreamUrlToMatchCurrentSnap(
  fetchUrl: URL,
  currentSnapUrl: URL,
): URL {
  const sameHost =
    fetchUrl.hostname === currentSnapUrl.hostname &&
    fetchUrl.port === currentSnapUrl.port;
  if (!sameHost || fetchUrl.protocol === currentSnapUrl.protocol) {
    return fetchUrl;
  }
  const next = new URL(fetchUrl.href);
  next.protocol = currentSnapUrl.protocol;
  return next;
}

export function toAbsoluteSnapTarget(baseUrl: string, target: string): string {
  return new URL(target, baseUrl).toString();
}

/** Validate that the response has the expected shape. */
function validateSpec(
  spec: unknown,
): spec is SnapPageResponse["ui"] {
  if (!spec || typeof spec !== "object") return false;
  const s = spec as Record<string, unknown>;
  return (
    typeof s.root === "string" &&
    typeof s.elements === "object" &&
    s.elements !== null &&
    !Array.isArray(s.elements)
  );

}

/** Unwrap response and validate shape. */
export function parseSnapPayload(payload: unknown): SnapPageResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Snap response is not valid JSON");
  }

  const candidate = payload as Record<string, unknown>;

  if (typeof candidate.version !== "string") {
    throw new Error("Snap response must include version");
  }

  if (!validateSpec(candidate.ui)) {
    throw new Error(
      'Snap response must include ui: { root: "...", elements: { ... } }',
    );
  }

  return {
    version: candidate.version,
    theme: candidate.theme as SnapPageResponse["theme"],
    effects: candidate.effects as SnapPageResponse["effects"],
    compute: candidate.compute as SnapPageResponse["compute"],
    ui: candidate.ui as SnapPageResponse["ui"],
  };
}
