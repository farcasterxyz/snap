"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

const COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#000000",
];

function createInitialGrid(): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: 16 }, () =>
    Array(16).fill(null)
  );

  const fillPixel = (r: number, c: number, color: string) => {
    if (r >= 0 && r < 16 && c >= 0 && c < 16) grid[r][c] = color;
  };

  [5, 6, 7, 8, 9, 10].forEach((c) => fillPixel(1, c, "#EAB308"));
  [4, 11].forEach((c) => fillPixel(2, c, "#EAB308"));
  [3, 12].forEach((c) => fillPixel(3, c, "#EAB308"));
  [2].forEach((c) => fillPixel(4, c, "#EAB308"));
  [13].forEach((c) => fillPixel(4, c, "#EAB308"));
  [2].forEach((c) => fillPixel(5, c, "#EAB308"));
  [13].forEach((c) => fillPixel(5, c, "#EAB308"));
  [2].forEach((c) => fillPixel(6, c, "#EAB308"));
  [2].forEach((c) => fillPixel(7, c, "#EAB308"));
  [2].forEach((c) => fillPixel(8, c, "#EAB308"));
  [13].forEach((c) => fillPixel(6, c, "#EAB308"));
  [13].forEach((c) => fillPixel(7, c, "#EAB308"));
  [2].forEach((c) => fillPixel(9, c, "#EAB308"));
  [13].forEach((c) => fillPixel(9, c, "#EAB308"));
  [3].forEach((c) => fillPixel(10, c, "#EAB308"));
  [12].forEach((c) => fillPixel(10, c, "#EAB308"));
  [4, 11].forEach((c) => fillPixel(11, c, "#EAB308"));
  [5, 6, 7, 8, 9, 10].forEach((c) => fillPixel(12, c, "#EAB308"));

  fillPixel(5, 5, "#3B82F6");
  fillPixel(5, 6, "#3B82F6");
  fillPixel(6, 5, "#3B82F6");
  fillPixel(6, 6, "#3B82F6");
  fillPixel(5, 9, "#3B82F6");
  fillPixel(5, 10, "#3B82F6");
  fillPixel(6, 9, "#3B82F6");
  fillPixel(6, 10, "#3B82F6");

  fillPixel(9, 5, "#EF4444");
  fillPixel(9, 6, "#EF4444");
  fillPixel(9, 7, "#EF4444");
  fillPixel(9, 8, "#EF4444");
  fillPixel(9, 9, "#EF4444");
  fillPixel(9, 10, "#EF4444");
  fillPixel(8, 4, "#EF4444");
  fillPixel(8, 11, "#EF4444");

  fillPixel(0, 0, "#8B5CF6");
  fillPixel(0, 15, "#8B5CF6");
  fillPixel(15, 0, "#22C55E");
  fillPixel(15, 15, "#22C55E");
  fillPixel(14, 7, "#06B6D4");
  fillPixel(14, 8, "#06B6D4");
  fillPixel(0, 7, "#F97316");
  fillPixel(0, 8, "#F97316");

  return grid;
}

interface ActivityEntry {
  user: string;
  color: string;
  row: number;
  col: number;
  time: string;
}

const RECENT_ACTIVITY: ActivityEntry[] = [
  { user: "@dwr.eth", color: "#3B82F6", row: 4, col: 7, time: "2s ago" },
  { user: "@jessepollak", color: "#EAB308", row: 13, col: 8, time: "5s ago" },
  { user: "@linda.eth", color: "#8B5CF6", row: 1, col: 3, time: "12s ago" },
];

const COLOR_NAMES: Record<string, string> = {
  "#EF4444": "red",
  "#F97316": "orange",
  "#EAB308": "yellow",
  "#22C55E": "green",
  "#06B6D4": "cyan",
  "#3B82F6": "blue",
  "#8B5CF6": "purple",
  "#000000": "black",
};

export default function FullPixelCanvas() {
  const [grid, setGrid] = useState<(string | null)[][]>(createInitialGrid);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [placedPixels, setPlacedPixels] = useState<Set<string>>(new Set());
  const [pixelCount, setPixelCount] = useState(2341);
  const [history, setHistory] = useState<{ row: number; col: number }[]>([]);
  const [activity, setActivity] = useState(RECENT_ACTIVITY);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (grid[row][col] !== null) return;

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = selectedColor;
        return next;
      });
      setPlacedPixels((prev) => new Set(prev).add(`${row}-${col}`));
      setPixelCount((prev) => prev + 1);
      setHistory((prev) => [...prev, { row, col }]);

      // Add to activity feed
      setActivity((prev) => [
        {
          user: "You",
          color: selectedColor,
          row,
          col,
          time: "just now",
        },
        ...prev.slice(0, 2),
      ]);
    },
    [grid, selectedColor]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[last.row][last.col] = null;
      return next;
    });
    setPlacedPixels((prev) => {
      const next = new Set(prev);
      next.delete(`${last.row}-${last.col}`);
      return next;
    });
    setPixelCount((prev) => prev - 1);
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  const CELL_SIZE = 21;

  return (
    <div className="canvas-gradient min-h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all text-[12px] text-gray-600"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
            Undo
          </button>
          <span className="text-[11px] text-gray-400">1x zoom</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500">
            {pixelCount.toLocaleString()} pixels
          </span>
          <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 live-pulse" />
            <span className="text-[11px] text-green-700 font-medium">
              847 artists
            </span>
          </div>
        </div>
      </div>

      {/* Canvas grid - larger */}
      <div className="flex-1 flex items-start justify-center pt-4 px-4">
        <div
          className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm"
          style={{
            width: CELL_SIZE * 16 + 2,
            display: "grid",
            gridTemplateColumns: `repeat(16, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(16, ${CELL_SIZE}px)`,
          }}
        >
          {grid.flatMap((row, r) =>
            row.map((color, c) => {
              const key = `${r}-${c}`;
              const justPlaced = placedPixels.has(key);
              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  className="border-[0.5px] border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  {color ? (
                    justPlaced ? (
                      <motion.div
                        className="w-full h-full"
                        style={{ backgroundColor: color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: color }}
                      />
                    )
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Color palette */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-gray-800 scale-125 shadow-md"
                  : "border-gray-300 hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-400 mt-2">
          Selected: {COLOR_NAMES[selectedColor] || "unknown"}
        </p>
      </div>

      {/* Recent activity */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Recent Activity
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.slice(0, 3).map((entry, i) => (
              <div
                key={i}
                className="px-3 py-2 flex items-center gap-2 text-[12px]"
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">
                  <span className="font-medium">{entry.user}</span> placed a{" "}
                  {COLOR_NAMES[entry.color] || "colored"} pixel at ({entry.col},{" "}
                  {entry.row})
                </span>
                <span className="text-gray-400 ml-auto text-[10px] shrink-0">
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
