"use client";

import type { ReactNode } from "react";
import { useStateStore } from "@json-render/react";
import { cn } from "@neynar/ui/utils";
import { POST_GRID_TAP_KEY, readableTextOnHex } from "@farcaster/snap";
import { useSnapColors } from "../hooks/use-snap-colors";

export function SnapCellGrid({
  element: { props, on },
  emit,
}: {
  element: { props: Record<string, unknown>; on?: Record<string, unknown> };
  emit: (name: string) => void;
}) {
  const { get, set } = useStateStore();
  const colors = useSnapColors();
  const cols = Number(props.cols ?? 2);
  const rows = Number(props.rows ?? 2);
  const select = String(props.select ?? "off");
  const isMultiple = select === "multiple";
  const isSelectable = select !== "off";
  const hasPressAction = Boolean(on?.press);
  const interactive = isSelectable || hasPressAction;
  const cells = Array.isArray(props.cells) ? props.cells : [];
  const gap = String(props.gap ?? "sm");
  const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
  const gapPx = gapMap[gap] ?? 1;
  const rowHeight = typeof props.rowHeight === "number" ? props.rowHeight : 28;

  const name = props.name ? String(props.name) : POST_GRID_TAP_KEY;
  const tapPath = `/inputs/${name}`;
  const tapRaw = get(tapPath);

  const cellMap = new Map<
    string,
    { color?: string; content?: string; value?: string }
  >();
  for (const c of cells) {
    cellMap.set(`${Number(c.row)},${Number(c.col)}`, {
      color: c.color as string | undefined,
      content: c.content != null ? String(c.content) : undefined,
      value: typeof c.value === "string" ? c.value : undefined,
    });
  }

  // Each cell's wire value — its `value` if set, otherwise "row,col" fallback.
  const cellWireValue = (r: number, c: number) =>
    cellMap.get(`${r},${c}`)?.value ?? `${r},${c}`;

  // Multi mode joins values with `|`; single mode is the value itself.
  const selectedSet = new Set<string>();
  if (typeof tapRaw === "string" && tapRaw.length > 0) {
    if (isMultiple) {
      for (const part of tapRaw.split("|")) {
        if (part.length > 0) selectedSet.add(part);
      }
    } else {
      selectedSet.add(tapRaw);
    }
  }

  const isSelected = (r: number, c: number) =>
    isSelectable && selectedSet.has(cellWireValue(r, c));

  const handleTap = (r: number, c: number) => {
    const wire = cellWireValue(r, c);
    if (isMultiple) {
      const next = new Set(selectedSet);
      if (next.has(wire)) next.delete(wire);
      else next.add(wire);
      set(tapPath, [...next].join("|"));
    } else {
      set(tapPath, wire);
    }
    if (hasPressAction) emit("press");
  };

  /** Cells without a palette `color` — subtle fill so empty slots read as tiles. */
  const emptyCellBg =
    colors.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

  const cellEls: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const selected = interactive && isSelected(r, c);
      const bgHex = cell?.color ? colors.colorHex(cell.color) : null;
      const bg = bgHex ?? emptyCellBg;
      const textColor = bgHex ? readableTextOnHex(bgHex) : colors.text;

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
            color: textColor,
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

  return (
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
  );
}
