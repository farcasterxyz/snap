"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCardWrapper from "../GameCardWrapper";

type TileColor = "green" | "yellow" | "gray" | "empty";

interface TileProps {
  letter: string;
  color: TileColor;
  delay?: number;
  animate?: boolean;
}

function Tile({ letter, color, delay = 0, animate = false }: TileProps) {
  const bgColors: Record<TileColor, string> = {
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    gray: "bg-gray-600",
    empty: "bg-transparent border-2 border-gray-600",
  };

  const content = (
    <div
      className={`w-[42px] h-[42px] flex items-center justify-center text-[18px] font-bold text-white rounded ${bgColors[color]}`}
    >
      {letter.toUpperCase()}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 0, 1] }}
        transition={{ delay, duration: 0.4, times: [0, 0.4, 1] }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

const ANSWER = "CLASS";

function getColors(guess: string): TileColor[] {
  const result: TileColor[] = Array(5).fill("gray");
  const answerArr = ANSWER.split("");
  const guessArr = guess.toUpperCase().split("");

  // First pass: greens
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "green";
      answerArr[i] = "_";
    }
  }

  // Second pass: yellows
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

// Pre-computed results for existing guesses
const PREVIOUS_GUESSES: { word: string; colors: TileColor[] }[] = [
  { word: "CRANE", colors: ["yellow", "gray", "green", "gray", "gray"] },
  { word: "MOIST", colors: ["gray", "gray", "gray", "green", "gray"] },
  { word: "CLASH", colors: ["green", "gray", "green", "green", "gray"] },
];

export default function CollaborativeWordle({ onOpenApp }: { onOpenApp?: () => void }) {
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newRow, setNewRow] = useState<{ word: string; colors: TileColor[] } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleSubmit = useCallback(() => {
    if (guess.length !== 5 || submitted) return;
    const colors = getColors(guess);
    setNewRow({ word: guess.toUpperCase(), colors });
    setIsRevealing(true);
    setSubmitted(true);

    setTimeout(() => {
      setIsRevealing(false);
    }, 1500);
  }, [guess, submitted]);

  return (
    <GameCardWrapper
      gradientClass="wordle-gradient"
      headerIcon={"#"}
      headerTitle="Daily Wordle"
      headerSubtitle="Day 12"
      stats="1,247 guesses submitted today · Attempt 4/6"
      linkText="Open full game &#8594;"
      likes={89}
      comments={34}
      onOpenApp={onOpenApp}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Previous guesses */}
        {PREVIOUS_GUESSES.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5">
            {row.word.split("").map((letter, i) => (
              <Tile key={i} letter={letter} color={row.colors[i]} />
            ))}
          </div>
        ))}

        {/* New row (if submitted) */}
        <AnimatePresence>
          {newRow && (
            <motion.div
              className="flex gap-1.5"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {newRow.word.split("").map((letter, i) => (
                <Tile
                  key={i}
                  letter={letter}
                  color={isRevealing ? "empty" : newRow.colors[i]}
                  delay={i * 0.3}
                  animate={isRevealing}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty rows */}
        {Array.from({ length: submitted ? 2 : 3 }).map((_, rowIdx) => (
          <div key={`empty-${rowIdx}`} className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Tile key={i} letter="" color="empty" />
            ))}
          </div>
        ))}
      </div>

      {/* Input area */}
      {!submitted ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            maxLength={5}
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Type 5-letter word..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-[14px] uppercase tracking-widest placeholder:text-gray-500 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleSubmit}
            disabled={guess.length !== 5}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-4 py-2 rounded-lg text-[14px] transition-colors"
          >
            Submit
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700"
        >
          <p className="text-green-400 text-[13px] font-medium">
            Your guess has been submitted!
          </p>
          <p className="text-gray-400 text-[11px] mt-1">
            The crowd&apos;s most popular guess will be locked in at 6pm
          </p>
        </motion.div>
      )}
    </GameCardWrapper>
  );
}
