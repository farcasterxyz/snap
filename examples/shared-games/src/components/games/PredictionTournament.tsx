"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCardWrapper from "../GameCardWrapper";

interface Predictor {
  rank: number;
  name: string;
  correct: number;
  total: number;
  medal?: string;
}

const LEADERBOARD: Predictor[] = [
  { rank: 1, name: "@dwr.eth", correct: 8, total: 10, medal: "\uD83E\uDD47" },
  { rank: 2, name: "@jessepollak", correct: 7, total: 10, medal: "\uD83E\uDD48" },
  { rank: 3, name: "@balajis.eth", correct: 7, total: 10, medal: "\uD83E\uDD49" },
  { rank: 4, name: "@linda.eth", correct: 6, total: 10 },
  { rank: 5, name: "You", correct: 0, total: 0 },
];

export default function PredictionTournament({ onOpenApp }: { onOpenApp?: () => void }) {
  const [prediction, setPrediction] = useState<"yes" | "no" | null>(null);
  const yesPercent = 72;
  const noPercent = 28;

  return (
    <GameCardWrapper
      gradientClass="prediction-gradient"
      headerIcon={"🔮"}
      headerTitle="Prediction Tournament"
      headerSubtitle="Tech Calls 2026"
      stats="Day 12 of 30 · 1,456 predictors"
      linkText="See all predictions &#8594;"
      likes={94}
      comments={51}
      onOpenApp={onOpenApp}
    >
      {/* Question */}
      <p className="text-[14px] font-medium text-green-900 mb-3">
        Will GPT-5 launch before July 2026?
      </p>

      {/* Voting buttons */}
      <AnimatePresence mode="wait">
        {!prediction ? (
          <motion.div
            key="buttons"
            className="flex gap-3 mb-4"
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setPrediction("yes")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-[16px] transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setPrediction("no")}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-[16px] transition-colors"
            >
              No
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            className="mb-4 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Yes bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className={`font-semibold ${prediction === "yes" ? "text-green-700" : "text-gray-600"}`}>
                  Yes {prediction === "yes" && "✓"}
                </span>
                <span className="font-bold text-green-700">{yesPercent}%</span>
              </div>
              <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${yesPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* No bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[12px]">
                <span className={`font-semibold ${prediction === "no" ? "text-red-600" : "text-gray-600"}`}>
                  No {prediction === "no" && "✓"}
                </span>
                <span className="font-bold text-red-600">{noPercent}%</span>
              </div>
              <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${noPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>

            <motion.p
              className="text-[11px] text-green-600/70 text-center pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              1,456 predictions so far · Resolves July 1, 2026
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard */}
      <div className="bg-white/60 rounded-xl border border-green-200/60 overflow-hidden">
        <div className="px-3 py-2 border-b border-green-100/60">
          <span className="text-[11px] font-semibold text-green-800/60 uppercase tracking-wide">
            Top Predictors
          </span>
        </div>
        <div className="divide-y divide-green-50">
          {LEADERBOARD.map((p, i) => {
            const pct = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
            const isUser = p.name === "You";
            return (
              <motion.div
                key={p.name}
                className={`flex items-center px-3 py-2 ${isUser ? "bg-green-50/50" : ""}`}
                initial={prediction ? { opacity: 0, x: -10 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prediction ? 0.8 + i * 0.1 : 0 }}
              >
                <span className="w-6 text-[13px] text-center">
                  {p.medal || `${p.rank}.`}
                </span>
                <span
                  className={`flex-1 text-[13px] ml-1 ${
                    isUser ? "font-semibold text-green-700" : "text-gray-700"
                  }`}
                >
                  {p.name}
                </span>
                <span className="text-[12px] text-gray-500">
                  {p.total > 0 ? (
                    <>
                      {p.correct}/{p.total}{" "}
                      <span className="text-green-600 font-medium">({pct}%)</span>
                    </>
                  ) : (
                    <span className="italic text-gray-400">just started!</span>
                  )}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GameCardWrapper>
  );
}
