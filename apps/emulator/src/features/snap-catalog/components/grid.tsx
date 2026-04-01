"use client";

import type { ReactNode } from "react";
import { useStateStore } from "@json-render/react";
import { cn } from "@neynar/ui/utils";
import { POST_GRID_TAP_KEY } from "@farcaster/snap";

export function SnapGrid({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const cols = Number(props.cols ?? 2);
  const rows = Number(props.rows ?? 2);
  const interactive = props.interactive === true;
  const cells = Array.isArray(props.cells) ? props.cells : [];
  const tapPath = `/inputs/${POST_GRID_TAP_KEY}`;
  const tapRaw = get(tapPath);
  const tapCoord =
    tapRaw && typeof tapRaw === "object" && "row" in tapRaw && "col" in tapRaw
      ? {
          row: Number((tapRaw as { row: unknown }).row),
          col: Number((tapRaw as { col: unknown }).col),
        }
      : null;
  const cellMap = new Map<string, { color?: string; content?: string }>();
  for (const c of cells) {
    const row = Number(c.row);
    const col = Number(c.col);
    cellMap.set(`${row},${col}`, {
      color: c.color as string | undefined,
      content: c.content != null ? String(c.content) : undefined,
    });
  }
  const cellsEls: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const selected =
        interactive &&
        tapCoord != null &&
        tapCoord.row === r &&
        tapCoord.col === c;
      const onPick = interactive
        ? () => set(tapPath, { row: r, col: c })
        : undefined;
      const cellClass = cn(
        "border-border flex min-h-7 w-full items-center justify-center rounded border text-xs font-semibold",
        interactive ? "cursor-pointer select-none" : "cursor-default",
        selected ? "border-2" : "border",
      );
      const cellStyle = {
        background: cell?.color ?? "transparent",
        borderColor: selected ? "var(--primary)" : undefined,
      } as const;
      const labelBase = `Cell ${r + 1},${c + 1}`;
      const label =
        cell?.content != null && String(cell.content).trim() !== ""
          ? `${labelBase}: ${cell.content}`
          : labelBase;
      const content = cell?.content ?? "";
      cellsEls.push(
        interactive ? (
          <button
            key={`${r}-${c}`}
            type="button"
            onClick={onPick}
            className={cellClass}
            style={cellStyle}
            aria-pressed={selected}
            aria-label={label}
          >
            {content}
          </button>
        ) : (
          <div key={`${r}-${c}`} className={cellClass} style={cellStyle}>
            {content}
          </div>
        ),
      );
    }
  }
  return (
    <div
      className="grid w-full gap-1"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {cellsEls}
    </div>
  );
}
