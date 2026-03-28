"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TileColor = "green" | "yellow" | "gray" | "empty";

const ANSWER = "CLASS";

function getColors(guess: string): TileColor[] {
  const result: TileColor[] = Array(5).fill("gray");
  const answerArr = ANSWER.split("");
  const guessArr = guess.toUpperCase().split("");

  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "green";
      answerArr[i] = "_";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === "green") continue;
    const idx = answerArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = "yellow";
      answerArr[idx] = "_";
    }
  }

  return result;
}

const PREVIOUS_GUESSES: { word: string; colors: TileColor[] }[] = [
  { word: "CRANE", colors: ["yellow", "gray", "green", "gray", "gray"] },
  { word: "MOIST", colors: ["gray", "gray", "gray", "green", "gray"] },
  { word: "CLASH", colors: ["green", "gray", "green", "green", "gray"] },
];

// Key colors based on previous guesses:
// Green (correct position): C (pos 0 in CLASH), A (pos 2 in CRANE/CLASH), S (pos 3 in CLASH)
// Yellow (present but wrong pos): none remaining after greens
// Gray (not in word): R, N, E, M, O, I, T, H, L
const KEY_COLORS: Record<string, TileColor> = {
  C: "green",
  A: "green",
  S: "green",
  R: "gray",
  N: "gray",
  E: "gray",
  M: "gray",
  O: "gray",
  I: "gray",
  T: "gray",
  H: "gray",
  L: "gray",
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

function Tile({
  letter,
  color,
  size = "normal",
}: {
  letter: string;
  color: TileColor;
  size?: "normal" | "large";
}) {
  const bgColors: Record<TileColor, string> = {
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    gray: "bg-gray-600",
    empty: "bg-transparent border-2 border-gray-600",
  };

  const sizeClass =
    size === "large"
      ? "w-[52px] h-[52px] text-[22px]"
      : "w-[52px] h-[52px] text-[22px]";

  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-bold text-white rounded-md ${bgColors[color]}`}
    >
      {letter.toUpperCase()}
    </div>
  );
}

export default function FullWordle() {
  const [mode, setMode] = useState<"crowd" | "solo">("crowd");
  const [currentGuess, setCurrentGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newRow, setNewRow] = useState<{
    word: string;
    colors: TileColor[];
  } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  // Solo mode state
  const [soloGuesses, setSoloGuesses] = useState<
    { word: string; colors: TileColor[] }[]
  >([]);
  const [soloCurrentGuess, setSoloCurrentGuess] = useState("");
  const [soloKeyColors, setSoloKeyColors] = useState<
    Record<string, TileColor>
  >({});

  const handleKeyPress = useCallback(
    (key: string) => {
      if (mode === "crowd") {
        if (submitted) return;
        if (key === "BACK") {
          setCurrentGuess((prev) => prev.slice(0, -1));
        } else if (key === "ENTER") {
          if (currentGuess.length !== 5) return;
          const colors = getColors(currentGuess);
          setNewRow({ word: currentGuess.toUpperCase(), colors });
          setIsRevealing(true);
          setSubmitted(true);
          setTimeout(() => setIsRevealing(false), 1500);
        } else if (currentGuess.length < 5) {
          setCurrentGuess((prev) => prev + key);
        }
      } else {
        if (soloGuesses.length >= 6) return;
        if (key === "BACK") {
          setSoloCurrentGuess((prev) => prev.slice(0, -1));
        } else if (key === "ENTER") {
          if (soloCurrentGuess.length !== 5) return;
          const colors = getColors(soloCurrentGuess);
          const newGuess = {
            word: soloCurrentGuess.toUpperCase(),
            colors,
          };
          setSoloGuesses((prev) => [...prev, newGuess]);
          setSoloCurrentGuess("");

          // Update key colors
          const newKeyColors = { ...soloKeyColors };
          soloCurrentGuess
            .toUpperCase()
            .split("")
            .forEach((letter, i) => {
              const existing = newKeyColors[letter];
              const newColor = colors[i];
              // Green overrides everything, yellow overrides gray
              if (
                newColor === "green" ||
                (newColor === "yellow" && existing !== "green") ||
                (!existing && newColor === "gray")
              ) {
                newKeyColors[letter] = newColor;
              }
            });
          setSoloKeyColors(newKeyColors);
        } else if (soloCurrentGuess.length < 5) {
          setSoloCurrentGuess((prev) => prev + key);
        }
      }
    },
    [
      mode,
      currentGuess,
      submitted,
      soloCurrentGuess,
      soloGuesses.length,
      soloKeyColors,
    ]
  );

  const getKeyColor = (key: string): string => {
    if (key === "ENTER" || key === "BACK") return "bg-gray-500";
    const color = mode === "crowd" ? KEY_COLORS[key] : soloKeyColors[key];
    if (!color) return "bg-gray-500";
    if (color === "green") return "bg-green-600";
    if (color === "yellow") return "bg-yellow-500";
    if (color === "gray") return "bg-gray-700";
    return "bg-gray-500";
  };

  const crowdGuessRows = [...PREVIOUS_GUESSES];
  if (newRow) crowdGuessRows.push(newRow);
  const crowdCurrentInput = !submitted ? currentGuess : "";
  const crowdEmptyCount = 6 - crowdGuessRows.length - (submitted ? 0 : 1);

  const soloEmptyCount =
    6 - soloGuesses.length - (soloCurrentGuess.length >= 0 ? 1 : 0);

  return (
    <div className="wordle-gradient min-h-full flex flex-col">
      {/* Mode tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setMode("crowd")}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            mode === "crowd"
              ? "text-white border-b-2 border-green-500"
              : "text-gray-400"
          }`}
        >
          Crowd Game
        </button>
        <button
          onClick={() => setMode("solo")}
          className={`flex-1 py-3 text-[14px] font-semibold transition-colors ${
            mode === "solo"
              ? "text-white border-b-2 border-green-500"
              : "text-gray-400"
          }`}
        >
          Solo Play
        </button>
      </div>

      {/* Game info */}
      <div className="text-center py-3">
        <p className="text-gray-400 text-[12px]">
          {mode === "crowd"
            ? "Day 12 · Attempt 4/6 · 1,247 guesses today"
            : "Practice Mode · Unlimited plays"}
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col items-center justify-start px-4">
        <div className="flex flex-col gap-1.5">
          {mode === "crowd" ? (
            <>
              {/* Previous guesses */}
              {crowdGuessRows.map((row, rowIdx) => (
                <motion.div
                  key={rowIdx}
                  className="flex gap-1.5"
                  initial={
                    rowIdx === crowdGuessRows.length - 1 && newRow
                      ? { opacity: 0, y: -10 }
                      : undefined
                  }
                  animate={{ opacity: 1, y: 0 }}
                >
                  {row.word.split("").map((letter, i) => (
                    <Tile
                      key={i}
                      letter={letter}
                      color={
                        rowIdx === crowdGuessRows.length - 1 &&
                        newRow &&
                        isRevealing
                          ? "empty"
                          : row.colors[i]
                      }
                    />
                  ))}
                </motion.div>
              ))}

              {/* Current typing row */}
              {!submitted && (
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={
                        crowdCurrentInput[i]
                          ? { scale: [1, 1.1, 1] }
                          : undefined
                      }
                      transition={{ duration: 0.1 }}
                    >
                      <Tile
                        letter={crowdCurrentInput[i] || ""}
                        color={crowdCurrentInput[i] ? "empty" : "empty"}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty rows */}
              {Array.from({ length: Math.max(0, crowdEmptyCount) }).map(
                (_, rowIdx) => (
                  <div key={`empty-${rowIdx}`} className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Tile key={i} letter="" color="empty" />
                    ))}
                  </div>
                )
              )}
            </>
          ) : (
            <>
              {/* Solo guesses */}
              {soloGuesses.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-1.5">
                  {row.word.split("").map((letter, i) => (
                    <Tile key={i} letter={letter} color={row.colors[i]} />
                  ))}
                </div>
              ))}

              {/* Current typing row (solo) */}
              {soloGuesses.length < 6 && (
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={
                        soloCurrentGuess[i]
                          ? { scale: [1, 1.1, 1] }
                          : undefined
                      }
                      transition={{ duration: 0.1 }}
                    >
                      <Tile
                        letter={soloCurrentGuess[i] || ""}
                        color={soloCurrentGuess[i] ? "empty" : "empty"}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty rows (solo) */}
              {Array.from({
                length: Math.max(0, soloEmptyCount - 1),
              }).map((_, rowIdx) => (
                <div key={`solo-empty-${rowIdx}`} className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Tile key={i} letter="" color="empty" />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Submitted message (crowd) */}
        <AnimatePresence>
          {mode === "crowd" && submitted && (
            <motion.div
              className="mt-4 bg-gray-800/50 rounded-lg p-3 border border-gray-700 w-full max-w-[280px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              <p className="text-green-400 text-[13px] font-medium text-center">
                Your guess has been submitted!
              </p>
              <p className="text-gray-400 text-[11px] mt-1 text-center">
                The crowd&apos;s most popular guess will be locked in at 6pm
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* On-screen keyboard */}
      <div className="px-2 pb-4 pt-3 space-y-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1">
            {row.map((key) => {
              const isSpecial = key === "ENTER" || key === "BACK";
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`${getKeyColor(key)} ${
                    isSpecial ? "px-3 min-w-[52px]" : "w-[32px]"
                  } h-[44px] rounded-md text-white font-semibold text-[13px] active:opacity-70 transition-opacity flex items-center justify-center`}
                >
                  {key === "BACK" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z"
                      />
                    </svg>
                  ) : key === "ENTER" ? (
                    <span className="text-[11px]">ENTER</span>
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
