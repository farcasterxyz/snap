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
      cellsEls.push(
        <div
          key={`${r}-${c}`}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={onPick}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    set(tapPath, { row: r, col: c });
                  }
                }
              : undefined
          }
          className={cn(
            "border-border flex min-h-7 items-center justify-center rounded border text-xs font-semibold",
            interactive ? "cursor-pointer select-none" : "cursor-default",
            selected ? "border-2" : "border",
          )}
          style={{
            background: cell?.color ?? "transparent",
            borderColor: selected ? "var(--primary)" : undefined,
          }}
        >
          {cell?.content ?? ""}
        </div>,
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
