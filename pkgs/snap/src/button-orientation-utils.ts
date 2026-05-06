export type ButtonContentOrientation = "horizontal" | "vertical";

const MAX_HORIZONTAL_TOTAL_LENGTH: Record<number, number> = {
  2: 20,
  3: 15,
  4: 11,
  5: 8,
};

function displayLength(label: string): number {
  return Array.from(label.trim().replace(/\s+/g, " ")).length;
}

export function getButtonContentOrientation(
  labels: readonly string[],
): ButtonContentOrientation {
  const lengths = labels
    .map((label) => displayLength(label))
    .filter((length) => length > 0);
  const count = lengths.length;

  if (count <= 1) return "horizontal";

  const maxTotalLength = MAX_HORIZONTAL_TOTAL_LENGTH[count] ?? 0;

  if (maxTotalLength === 0) return "vertical";

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  return totalLength <= maxTotalLength ? "horizontal" : "vertical";
}

export function shouldUseHorizontalButtonContent(
  labels: readonly string[],
): boolean {
  return getButtonContentOrientation(labels) === "horizontal";
}
