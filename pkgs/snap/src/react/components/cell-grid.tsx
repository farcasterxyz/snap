"use client";

import type { ReactNode } from "react";
import { useStateStore } from "@json-render/react";
import { cn } from "@neynar/ui/utils";
import { POST_GRID_TAP_KEY } from "@farcaster/snap";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapCellGrid({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
  const cols = Number(props.cols ?? 2);
  const rows = Number(props.rows ?? 2);
  const select = String(props.select ?? "off");
  const interactive = select !== "off";
  const isMultiple = select === "multiple";
  const cells = Array.isArray(props.cells) ? props.cells : [];
  const gap = String(props.gap ?? "sm");
  const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
  const gapPx = gapMap[gap] ?? 1;
  const rowHeight = typeof props.rowHeight === "number" ? props.rowHeight : 28;

  const name = props.name ? String(props.name) : POST_GRID_TAP_KEY;
  const tapPath = `/inputs/${name}`;
  const tapRaw = get(tapPath);

  // Parse selection — single mode: "row,col" string; multi mode: "row,col|row,col|..." string
  const selectedSet = new Set<string>();
  if (typeof tapRaw === "string" && tapRaw.length > 0) {
    for (const part of tapRaw.split("|")) {
      if (part.includes(",")) selectedSet.add(part);
    }
  }

  const isSelected = (r: number, c: number) => selectedSet.has(`${r},${c}`);

  const handleTap = (r: number, c: number) => {
    const key = `${r},${c}`;
    if (isMultiple) {
      const next = new Set(selectedSet);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      set(tapPath, [...next].join("|"));
    } else {
      set(tapPath, key);
    }
  };

  const cellMap = new Map<string, { color?: string; content?: string }>();
  for (const c of cells) {
    cellMap.set(`${Number(c.row)},${Number(c.col)}`, {
      color: c.color as string | undefined,
      content: c.content != null ? String(c.content) : undefined,
    });
  }

  const cellEls: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const selected = interactive && isSelected(r, c);
      const bg = cell?.color ? colors.colorHex(cell.color) : "transparent";

      cellEls.push(
        <div
          key={`${r}-${c}`}
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : undefined}
          onClick={interactive ? () => handleTap(r, c) : undefined}
          onKeyDown={
            interactive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTap(r, c);
                  }
                }
              : undefined
          }
          className={cn(
            "flex items-center justify-center rounded text-xs font-semibold",
            interactive ? "cursor-pointer select-none" : "cursor-default",
          )}
          style={{
            height: rowHeight,
            background: bg,
            boxShadow: selected
              ? `inset 0 0 0 1px ${colors.mode === "dark" ? "#000" : "#fff"}, inset 0 0 0 2px ${colors.mode === "dark" ? "#fff" : "#000"}`
              : undefined,
          }}
        >
          {cell?.content ?? ""}
        </div>,
      );
    }
  }

  const selectionLabel = interactive && selectedSet.size > 0
    ? `inputs.${name}: ${[...selectedSet].join(isMultiple ? " | " : "")}`
    : null;

  return (
    <div>
      <div
        style={{
          display: "grid",
          width: "100%",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: gapPx,
          padding: 4,
          borderRadius: 8,
          backgroundColor: colors.muted,
        }}
      >
        {cellEls}
      </div>
      {selectionLabel && (
        <div className="mt-1.5 truncate text-xs font-mono" style={{ color: colors.textMuted }}>
          {selectionLabel}
        </div>
      )}
    </div>
  );
}
