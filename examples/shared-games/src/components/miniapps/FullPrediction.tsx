"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Predictor {
  rank: number;
  name: string;
  correct: number;
  total: number;
  streak: number;
  medal?: string;
}

const LEADERBOARD: Predictor[] = [
  { rank: 1, name: "@dwr.eth", correct: 8, total: 10, streak: 5, medal: "\uD83E\uDD47" },
  { rank: 2, name: "@jessepollak", correct: 7, total: 10, streak: 3, medal: "\uD83E\uDD48" },
  { rank: 3, name: "@balajis.eth", correct: 7, total: 10, streak: 2, medal: "\uD83E\uDD49" },
  { rank: 4, name: "@linda.eth", correct: 6, total: 10, streak: 4 },
  { rank: 5, name: "@ccarella", correct: 6, total: 10, streak: 1 },
  { rank: 6, name: "@0xdesigner", correct: 5, total: 10, streak: 2 },
  { rank: 7, name: "@ace", correct: 5, total: 10, streak: 0 },
  { rank: 8, name: "@ted", correct: 4, total: 10, streak: 1 },
  { rank: 9, name: "@binji.eth", correct: 4, total: 10, streak: 3 },
  { rank: 10, name: "You", correct: 0, total: 0, streak: 0 },
];

interface PastPrediction {
  day: number;
  question: string;
  outcome: boolean; // true = Yes, false = No
  userPick: boolean;
  correct: boolean;
}

const PAST_PREDICTIONS: PastPrediction[] = [
  {
    day: 11,
    question: "Will Ethereum ETF see $1B inflows in March?",
    outcome: true,
    userPick: true,
    correct: true,
  },
  {
    day: 10,
    question: "Will Apple announce AR glasses at WWDC?",
    outcome: false,
    userPick: true,
    correct: false,
  },
  {
    day: 9,
    question: "Will Bitcoin stay above $80k this week?",
    outcome: true,
    userPick: true,
    correct: true,
  },
  {
    day: 8,
    question: "Will Farcaster reach 100k DAU this month?",
    outcome: false,
    userPick: false,
    correct: true,
  },
  {
    day: 7,
    question: "Will any L2 flip Ethereum in daily txns?",
    outcome: true,
    userPick: true,
    correct: true,
  },
];

export default function FullPrediction() {
  const [prediction, setPrediction] = useState<"yes" | "no" | null>(null);
  const [tab, setTab] = useState<"today" | "leaderboard" | "history">("today");
  const yesPercent = 72;
  const noPercent = 28;

  // User stats
  const userCorrect = PAST_PREDICTIONS.filter((p) => p.correct).length;
  const userTotal = PAST_PREDICTIONS.length;
  const userStreak = 2; // Current streak
  const bestStreak = 3;

  return (
    <div className="prediction-gradient min-h-full flex flex-col">
      {/* Tournament info */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green-200/50">
        <span className="text-[12px] text-green-700 font-medium">
          30-day tournament &middot; 18 days remaining
        </span>
        <span className="text-[11px] text-green-600">
          1,456 predictors
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-green-200/50">
        {(
          [
            ["today", "Today"],
            ["leaderboard", "Leaderboard"],
            ["history", "History"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
              tab === key
                ? "text-green-800 border-b-2 border-green-600"
                : "text-green-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              {/* Today's question */}
              <div className="bg-white/80 rounded-2xl border border-green-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[18px]">&#x1F52E;</span>
                  <span className="text-[12px] text-green-600 font-medium uppercase tracking-wide">
                    Day 12 &middot; Today&apos;s Question
                  </span>
                </div>

                <p className="text-[17px] font-semibold text-green-900 mb-5 leading-relaxed">
                  Will GPT-5 launch before July 2026?
                </p>

                <AnimatePresence mode="wait">
                  {!prediction ? (
                    <motion.div
                      key="buttons"
                      className="flex gap-3"
                      exit={{ opacity: 0 }}
                    >
                      <button
                        onClick={() => setPrediction("yes")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-[17px] transition-colors shadow-sm"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setPrediction("no")}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-[17px] transition-colors shadow-sm"
                      >
                        No
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results"
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Yes bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[13px]">
                          <span
                            className={`font-semibold ${
                              prediction === "yes"
                                ? "text-green-700"
                                : "text-gray-600"
                            }`}
                          >
                            Yes {prediction === "yes" && " (your pick)"}
                          </span>
                          <span className="font-bold text-green-700">
                            {yesPercent}%
                          </span>
                        </div>
                        <div className="h-4 bg-green-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-green-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${yesPercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* No bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[13px]">
                          <span
                            className={`font-semibold ${
                              prediction === "no"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            No {prediction === "no" && " (your pick)"}
                          </span>
                          <span className="font-bold text-red-600">
                            {noPercent}%
                          </span>
                        </div>
                        <div className="h-4 bg-red-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-red-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${noPercent}%` }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut",
                              delay: 0.1,
                            }}
                          />
                        </div>
                      </div>

                      <motion.p
                        className="text-[12px] text-green-600/70 text-center pt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        1,456 predictions &middot; Resolves July 1, 2026
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Your stats */}
              <div className="mt-4 bg-white/60 rounded-xl border border-green-200/50 p-4">
                <h3 className="text-[12px] font-semibold text-green-800/60 uppercase tracking-wide mb-3">
                  Your Stats
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-green-700">
                      {userCorrect}/{userTotal}
                    </div>
                    <div className="text-[10px] text-green-600/60">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-green-700">
                      {userTotal > 0
                        ? Math.round((userCorrect / userTotal) * 100)
                        : 0}
                      %
                    </div>
                    <div className="text-[10px] text-green-600/60">
                      Accuracy
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-green-700">
                      {userStreak}
                    </div>
                    <div className="text-[10px] text-green-600/60">
                      Streak
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[22px] font-bold text-green-700">
                      {bestStreak}
                    </div>
                    <div className="text-[10px] text-green-600/60">
                      Best
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              <div className="bg-white/80 rounded-xl border border-green-200/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-green-100/50 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-green-800">
                    Top Predictors
                  </span>
                  <span className="text-[11px] text-green-500">
                    Ranked by accuracy
                  </span>
                </div>
                <div className="divide-y divide-green-50">
                  {LEADERBOARD.map((p) => {
                    const pct =
                      p.total > 0
                        ? Math.round((p.correct / p.total) * 100)
                        : 0;
                    const isUser = p.name === "You";
                    return (
                      <motion.div
                        key={p.name}
                        className={`flex items-center px-4 py-3 ${
                          isUser ? "bg-green-50/70" : ""
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: p.rank * 0.05 }}
                      >
                        <span className="w-8 text-[14px] text-center font-medium">
                          {p.medal || `${p.rank}.`}
                        </span>
                        <span
                          className={`flex-1 text-[14px] ml-1 ${
                            isUser
                              ? "font-semibold text-green-700"
                              : "text-gray-700"
                          }`}
                        >
                          {p.name}
                        </span>
                        <div className="flex items-center gap-3">
                          {p.streak > 0 && (
                            <span className="text-[11px] text-orange-500">
                              &#x1F525; {p.streak}
                            </span>
                          )}
                          <span className="text-[13px] text-gray-500">
                            {p.total > 0 ? (
                              <>
                                {p.correct}/{p.total}{" "}
                                <span className="text-green-600 font-semibold">
                                  ({pct}%)
                                </span>
                              </>
                            ) : (
                              <span className="italic text-gray-400">
                                new
                              </span>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              <div className="space-y-3">
                {PAST_PREDICTIONS.map((p, i) => (
                  <motion.div
                    key={p.day}
                    className={`bg-white/80 rounded-xl border p-4 ${
                      p.correct
                        ? "border-green-200"
                        : "border-red-200"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[11px] text-gray-400 font-medium">
                        Day {p.day}
                      </span>
                      <span
                        className={`text-[12px] font-semibold ${
                          p.correct ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {p.correct ? "Correct" : "Wrong"}
                      </span>
                    </div>
                    <p className="text-[14px] text-gray-800 leading-relaxed mb-2">
                      {p.question}
                    </p>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="text-gray-500">
                        Outcome:{" "}
                        <span
                          className={
                            p.outcome ? "text-green-600 font-semibold" : "text-red-500 font-semibold"
                          }
                        >
                          {p.outcome ? "Yes" : "No"}
                        </span>
                      </span>
                      <span className="text-gray-300">&middot;</span>
                      <span className="text-gray-500">
                        You:{" "}
                        <span className="font-medium">
                          {p.userPick ? "Yes" : "No"}
                        </span>
                      </span>
                      <span className="ml-auto">
                        {p.correct ? (
                          <span className="text-green-500">&#x2705;</span>
                        ) : (
                          <span className="text-red-500">&#x274C;</span>
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
