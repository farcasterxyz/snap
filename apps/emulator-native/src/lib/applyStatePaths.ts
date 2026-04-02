export function applyStatePaths(
  model: Record<string, unknown>,
  changes: Array<{ path: string; value: unknown }>,
): void {
  for (const { path, value } of changes) {
    const trimmed = path.replace(/^\//, "");
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length < 2) continue;
    const [top, ...rest] = parts;
    let cursor: Record<string, unknown> = model;
    if (top === "inputs") {
      if (typeof cursor.inputs !== "object" || cursor.inputs === null) {
        cursor.inputs = {};
      }
      const inputs = cursor.inputs as Record<string, unknown>;
      if (rest.length === 1) {
        inputs[rest[0]!] = value;
      }
      continue;
    }
    if (top === "theme") {
      if (typeof cursor.theme !== "object" || cursor.theme === null) {
        cursor.theme = {};
      }
      const theme = cursor.theme as Record<string, unknown>;
      if (rest.length === 1) {
        theme[rest[0]!] = value;
      }
    }
  }
}
