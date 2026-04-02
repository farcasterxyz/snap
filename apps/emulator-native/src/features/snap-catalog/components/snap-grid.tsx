import { POST_GRID_TAP_KEY } from "@farcaster/snap";
import type { ComponentRenderProps } from "@json-render/react-native";
import { useStateStore } from "@json-render/react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSnapPalette } from "../useSnapPalette";

type CellDef = { row: number; col: number; color?: string; content?: string };

function gapToPx(gap: string | undefined): number {
  if (gap === "none") return 0;
  if (gap === "medium") return 8;
  return 4;
}

export function SnapGrid({
  element: { props },
}: ComponentRenderProps<Record<string, unknown>>) {
  const { get, set } = useStateStore();
  const { accentHex } = useSnapPalette();
  const cols = Math.max(2, Number(props.cols ?? 2));
  const rows = Math.max(2, Number(props.rows ?? 2));
  const interactive = props.interactive === true;
  const cellSize = String(props.cellSize ?? "auto");
  const gapPx = gapToPx(
    props.gap != null ? String(props.gap) : undefined,
  );

  const cells = Array.isArray(props.cells) ? (props.cells as CellDef[]) : [];
  const tapPath = `/inputs/${POST_GRID_TAP_KEY}`;
  const tapRaw = get(tapPath);
  const tapCoord =
    tapRaw &&
    typeof tapRaw === "object" &&
    tapRaw !== null &&
    "row" in tapRaw &&
    "col" in tapRaw
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
      color: typeof c.color === "string" ? c.color : undefined,
      content: c.content != null ? String(c.content) : undefined,
    });
  }

  const gridRows: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const rowCells: ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const cell = cellMap.get(key);
      /** Spec: only positions omitted from `cells` are tappable when `interactive`. */
      const isWall = cellMap.has(key);
      const isTappable = interactive && !isWall;
      const selected =
        isTappable &&
        tapCoord != null &&
        tapCoord.row === r &&
        tapCoord.col === c;
      const onPick = isTappable
        ? () => set(tapPath, { row: r, col: c })
        : undefined;
      const bg = cell?.color ?? "transparent";
      const content = cell?.content ?? "";
      const cellInner = (
        <Text style={styles.cellText} numberOfLines={2}>
          {content}
        </Text>
      );

      const baseStyle = [
        styles.cell,
        cellSize === "square" && styles.cellSquare,
        {
          backgroundColor: bg,
          borderColor: isTappable && selected ? accentHex : "#d1d5db",
          borderWidth:
            isTappable && selected ? 2 : StyleSheet.hairlineWidth,
        },
      ];

      rowCells.push(
        isTappable ? (
          <Pressable
            key={key}
            onPress={onPick}
            style={({ pressed }) => [
              ...baseStyle,
              { opacity: pressed ? 0.88 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: !!selected }}
          >
            {cellInner}
          </Pressable>
        ) : (
          <View key={key} style={baseStyle}>
            {cellInner}
          </View>
        ),
      );
    }
    gridRows.push(
      <View
        key={`row-${r}`}
        style={[styles.gridRow, { gap: gapPx, marginBottom: r < rows - 1 ? gapPx : 0 }]}
      >
        {rowCells}
      </View>,
    );
  }

  return <View style={styles.wrap}>{gridRows}</View>;
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  gridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  cell: {
    flex: 1,
    minWidth: 0,
    minHeight: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  cellSquare: {
    aspectRatio: 1,
  },
  cellText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
