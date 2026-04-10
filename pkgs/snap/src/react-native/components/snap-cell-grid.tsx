import type { ComponentRenderProps } from "@json-render/react-native";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useStateStore } from "@json-render/react-native";
import { useSnapPalette } from "../use-snap-palette";
import { useSnapTheme } from "../theme";
import { POST_GRID_TAP_KEY } from "@farcaster/snap";

export function SnapCellGrid({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
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
  const interactive = select !== "off";
  const isMultiple = select === "multiple";

  const name = props.name ? String(props.name) : POST_GRID_TAP_KEY;
  const tapPath = `/inputs/${name}`;
  const tapRaw = get(tapPath);

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

  const ringOuter = appearance === "dark" ? "#fff" : "#000";
  const ringInner = appearance === "dark" ? "#000" : "#fff";

  const rowEls = [];
  for (let r = 0; r < rows; r++) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      const selected = interactive && isSelected(r, c);
      const bg = cell?.color ? hex(cell.color) : "transparent";

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

  const selectionLabel = interactive && selectedSet.size > 0
    ? `inputs.${name}: ${[...selectedSet].join(isMultiple ? " | " : "")}`
    : null;

  return (
    <View style={[styles.wrap, { gap: gapPx, backgroundColor: colors.muted, padding: 4, borderRadius: 8 }]}>
      {rowEls}
      {selectionLabel ? (
        <Text style={[styles.selectionText, { color: colors.textSecondary }]}>
          {selectionLabel}
        </Text>
      ) : null}
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
  selectionText: { fontSize: 11, fontFamily: "monospace", marginTop: 6 },
});
