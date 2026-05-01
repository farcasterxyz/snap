import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useStateStore } from "@json-render/react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { POST_GRID_TAP_KEY } from "@farcaster/snap";

export function SnapCellGrid({
  element,
  emit,
}: ComponentRenderProps<Record<string, unknown>>) {
  const { props } = element;
  const on = (element as unknown as { on?: Record<string, unknown> }).on;
  const { hex, appearance } = useSnapPalette();
  const { colors } = useSnapTheme();
  const { get, set } = useStateStore();
  const cols = Number(props.cols ?? 2);
  const rows = Number(props.rows ?? 2);
  const cells = Array.isArray(props.cells) ? props.cells : [];
  const rowHeight = typeof props.rowHeight === "number" ? props.rowHeight : 28;
  const gap = String(props.gap ?? "sm");
  const gapMap: Record<string, number> = { none: 0, sm: 1, md: 2, lg: 4 };
  const gapPx = gapMap[gap] ?? 1;

  const select = String(props.select ?? "off");
  const isMultiple = select === "multiple";
  const isSelectable = select !== "off";
  const hasPressAction = Boolean(on?.press);
  const interactive = isSelectable || hasPressAction;

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

  const ringOuter = appearance === "dark" ? "#fff" : "#000";
  const ringInner = appearance === "dark" ? "#000" : "#fff";

  /** Cells without a palette `color` — subtle fill so empty slots read as tiles. */
  const emptyCellBg =
    appearance === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

  const rowEls = [];
  for (let r = 0; r < rows; r++) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const selected = interactive && isSelected(r, c);
      const bg = cell?.color ? hex(cell.color) : emptyCellBg;

      const cellContent = cell?.content ? (
        <Text style={[styles.cellText, { color: colors.textPrimary }]}>
          {cell.content}
        </Text>
      ) : null;

      // Two-tone ring: outer View with contrasting border, inner View with inverse border
      const cellView = selected ? (
        <View style={[styles.cell, { height: rowHeight, borderWidth: 1, borderColor: ringOuter, borderRadius: 4 }]}>
          <View
            style={[
              styles.innerCell,
              { backgroundColor: bg, borderWidth: 1, borderColor: ringInner, borderRadius: 3 },
            ]}
          >
            {cellContent}
          </View>
        </View>
      ) : (
        <View style={[styles.cell, { height: rowHeight, backgroundColor: bg }]}>
          {cellContent}
        </View>
      );

      rowCells.push(
        interactive ? (
          <Pressable
            key={`${r}-${c}`}
            onPress={() => handleTap(r, c)}
            style={styles.cellWrap}
          >
            {cellView}
          </Pressable>
        ) : (
          <View key={`${r}-${c}`} style={styles.cellWrap}>
            {cellView}
          </View>
        ),
      );
    }
    rowEls.push(
      <View key={r} style={[styles.gridRow, { gap: gapPx }]}>
        {rowCells}
      </View>,
    );
  }

  return (
    <View style={[styles.wrap, { gap: gapPx, backgroundColor: colors.muted, padding: 4, borderRadius: 8 }]}>
      {rowEls}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  gridRow: { flexDirection: "row" },
  cellWrap: { flex: 1 },
  cell: {
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCell: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
});
