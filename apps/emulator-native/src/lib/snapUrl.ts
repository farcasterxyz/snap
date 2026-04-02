/**
 * Resolve target relative to the current snap URL (same as web
 * `toAbsoluteSnapTarget` + scheme coercion).
 */
export function toAbsoluteSnapTarget(baseUrl: string, target: string): string {
  return new URL(target, baseUrl).toString();
}

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
