export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SnapPageResponse = {
  version: string;
  page: {
    theme?: { accent?: string };
    elements: { type: string; children: Array<Record<string, JsonValue>> };
    buttons?: Array<Record<string, JsonValue>>;
    button_layout?: "stack" | "row" | "grid";
  };
};

type WrappedSnapResponse = {
  snap?: SnapPageResponse;
  page?: SnapPageResponse["page"];
  version?: string;
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

/**
 * Ensure `page` matches the snap spec: `page.elements` is `{ type: "stack", children: [...] }`.
 */
export function normalizeSnapPageShape(
  page: Record<string, JsonValue>,
): SnapPageResponse["page"] {
  const elementsRaw = page.elements;
  let children: unknown;
  let hadRootObject = false;

  if (
    elementsRaw &&
    typeof elementsRaw === "object" &&
    !Array.isArray(elementsRaw)
  ) {
    hadRootObject = true;
    children = (elementsRaw as { children?: unknown }).children;
  }

  if (!Array.isArray(children)) {
    throw new Error(
      'Snap page must include page.elements with children: { "type": "stack", "children": [...] } (spec).',
    );
  }

  if (
    hadRootObject &&
    elementsRaw &&
    typeof elementsRaw === "object" &&
    !Array.isArray(elementsRaw)
  ) {
    const t = (elementsRaw as { type?: unknown }).type;
    if (t !== undefined && t !== "stack") {
      throw new Error(
        `Snap page.elements.type must be "stack" (got ${JSON.stringify(t)})`,
      );
    }
  }

  const {
    elements: _elements,
    root: _root,
    ...rest
  } = page as Record<string, JsonValue> & {
    elements?: unknown;
    root?: unknown;
  };

  return {
    ...rest,
    elements: {
      type: "stack",
      children: children as Array<Record<string, JsonValue>>,
    },
  };
}

/** Unwrap `{ snap }` envelopes and normalize page root for rendering. */
export function parseSnapPayload(payload: unknown): SnapPageResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Snap response is not valid JSON");
  }

  const maybeWrapped = payload as WrappedSnapResponse;
  const candidate =
    maybeWrapped.snap && typeof maybeWrapped.snap === "object"
      ? maybeWrapped.snap
      : maybeWrapped;

  if (!candidate || typeof candidate !== "object") {
    throw new Error("Could not locate snap page in response");
  }

  if (
    typeof candidate.version !== "string" ||
    !candidate.page ||
    typeof candidate.page !== "object"
  ) {
    throw new Error("Snap response must include version and page");
  }

  const page = normalizeSnapPageShape(
    candidate.page as Record<string, JsonValue>,
  );

  return {
    version: candidate.version,
    page,
  };
}
