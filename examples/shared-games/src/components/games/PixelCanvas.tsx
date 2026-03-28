"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import GameCardWrapper from "../GameCardWrapper";

const COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#000000", // black
];

// Pre-filled pixels forming a partial smiley face (~40% filled)
// 16x16 grid: 0 = empty, string = color hex
function createInitialGrid(): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: 16 }, () =>
    Array(16).fill(null)
  );

  // Smiley face outline (partial)
  const fillPixel = (r: number, c: number, color: string) => {
    if (r >= 0 && r < 16 && c >= 0 && c < 16) grid[r][c] = color;
  };

  // Top of circle
  [5, 6, 7, 8, 9, 10].forEach((c) => fillPixel(1, c, "#EAB308"));
  [4, 11].forEach((c) => fillPixel(2, c, "#EAB308"));
  [3, 12].forEach((c) => fillPixel(3, c, "#EAB308"));
  [2].forEach((c) => fillPixel(4, c, "#EAB308"));
  [13].forEach((c) => fillPixel(4, c, "#EAB308"));
  [2].forEach((c) => fillPixel(5, c, "#EAB308"));
  [13].forEach((c) => fillPixel(5, c, "#EAB308"));
  // Left side continues
  [2].forEach((c) => fillPixel(6, c, "#EAB308"));
  [2].forEach((c) => fillPixel(7, c, "#EAB308"));
  [2].forEach((c) => fillPixel(8, c, "#EAB308"));
  // Right side partial (some missing = "in progress")
  [13].forEach((c) => fillPixel(6, c, "#EAB308"));
  [13].forEach((c) => fillPixel(7, c, "#EAB308"));

  // Bottom of circle
  [2].forEach((c) => fillPixel(9, c, "#EAB308"));
  [13].forEach((c) => fillPixel(9, c, "#EAB308"));
  [3].forEach((c) => fillPixel(10, c, "#EAB308"));
  [12].forEach((c) => fillPixel(10, c, "#EAB308"));
  [4, 11].forEach((c) => fillPixel(11, c, "#EAB308"));
  [5, 6, 7, 8, 9, 10].forEach((c) => fillPixel(12, c, "#EAB308"));

  // Left eye
  fillPixel(5, 5, "#3B82F6");
  fillPixel(5, 6, "#3B82F6");
  fillPixel(6, 5, "#3B82F6");
  fillPixel(6, 6, "#3B82F6");

  // Right eye
  fillPixel(5, 9, "#3B82F6");
  fillPixel(5, 10, "#3B82F6");
  fillPixel(6, 9, "#3B82F6");
  fillPixel(6, 10, "#3B82F6");

  // Smile (partial — some pixels missing)
  fillPixel(9, 5, "#EF4444");
  fillPixel(9, 6, "#EF4444");
  fillPixel(9, 7, "#EF4444");
  fillPixel(9, 8, "#EF4444");
  fillPixel(9, 9, "#EF4444");
  fillPixel(9, 10, "#EF4444");
  fillPixel(8, 4, "#EF4444");
  fillPixel(8, 11, "#EF4444");

  // Some scattered art pixels (other people's contributions)
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

export default function PixelCanvas({ onOpenApp }: { onOpenApp?: () => void }) {
  const [grid, setGrid] = useState<(string | null)[][]>(createInitialGrid);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [placedPixels, setPlacedPixels] = useState<Set<string>>(new Set());
  const [pixelCount, setPixelCount] = useState(2341);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (grid[row][col] !== null) return; // already filled

      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = selectedColor;
        return next;
      });
      setPlacedPixels((prev) => new Set(prev).add(`${row}-${col}`));
      setPixelCount((prev) => prev + 1);
    },
    [grid, selectedColor]
  );

  const CELL_SIZE = 19;

  return (
    <GameCardWrapper
      gradientClass="canvas-gradient"
      headerIcon={"🎨"}
      headerTitle="Pixel Canvas"
      headerSubtitle="Hour 48"
      stats={`${pixelCount.toLocaleString()} pixels placed · 847 artists`}
      linkText="Open full canvas &#8594;"
      likes={156}
      comments={42}
      onOpenApp={onOpenApp}
    >
      {/* Canvas grid */}
      <div
        className="mx-auto border border-gray-300 rounded-lg overflow-hidden bg-white"
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
                className="border-[0.5px] border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
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

      {/* Color palette */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-[11px] text-gray-500 mr-1">Color:</span>
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              selectedColor === color
                ? "border-gray-800 scale-125"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </GameCardWrapper>
  );
}
