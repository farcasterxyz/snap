"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: number;
  text: string;
  answer: number;
  unit: string;
  max: number;
  step: number;
  formatAnswer: (n: number) => string;
  completed?: boolean;
  userAnswer?: number;
  accuracy?: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "How many mass daily active users does Farcaster have?",
    answer: 80000,
    unit: "users",
    max: 500000,
    step: 1000,
    formatAnswer: (n) => n.toLocaleString(),
    completed: true,
    userAnswer: 65000,
    accuracy: 81,
  },
  {
    id: 2,
    text: "How many casts are sent per day on Farcaster?",
    answer: 150000,
    unit: "casts",
    max: 1000000,
    step: 5000,
    formatAnswer: (n) => n.toLocaleString(),
    completed: true,
    userAnswer: 200000,
    accuracy: 67,
  },
  {
    id: 3,
    text: "How many countries have at least 100 Farcaster users?",
    answer: 42,
    unit: "countries",
    max: 200,
    step: 1,
    formatAnswer: (n) => n.toString(),
    completed: true,
    userAnswer: 35,
    accuracy: 83,
  },
  {
    id: 4,
    text: "How many total NFTs have been minted on Base?",
    answer: 25000000,
    unit: "NFTs",
    max: 100000000,
    step: 100000,
    formatAnswer: (n) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
      return n.toString();
    },
  },
  {
    id: 5,
    text: "How many channels exist on Farcaster?",
    answer: 12500,
    unit: "channels",
    max: 50000,
    step: 100,
    formatAnswer: (n) => n.toLocaleString(),
  },
];

function generateHistogramBars(): { min: number; max: number; count: number }[] {
  const bins: { min: number; max: number; count: number }[] = [];
  const binWidth = 25000;
  for (let i = 0; i < 500000; i += binWidth) {
    const center = 60000;
    const dist = Math.abs(i + binWidth / 2 - center);
    const base = Math.max(
      5,
      Math.round(200 * Math.exp(-(dist * dist) / (2 * 80000 * 80000)))
    );
    const noise = Math.round((Math.sin(i * 0.0001) + 1) * 15);
    bins.push({ min: i, max: i + binWidth, count: base + noise });
  }
  return bins;
}

export default function FullEstimate() {
  const [currentIdx, setCurrentIdx] = useState(3); // Start on the first unanswered question
  const [value, setValue] = useState(50000);
  const [submitted, setSubmitted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, { answer: number; accuracy: number }>
  >({});
  const histogram = useMemo(() => generateHistogramBars(), []);
  const maxCount = Math.max(...histogram.map((b) => b.count));

  const currentQ = QUESTIONS[currentIdx];
  const isCompleted =
    currentQ.completed || answeredQuestions[currentQ.id] !== undefined;
  const userAnswer =
    currentQ.userAnswer || answeredQuestions[currentQ.id]?.answer;
  const accuracy =
    currentQ.accuracy || answeredQuestions[currentQ.id]?.accuracy;

  const handleSubmit = () => {
    if (submitted || isCompleted) return;
    const diff = Math.abs(value - currentQ.answer);
    const pct = Math.min(
      95,
      Math.max(15, Math.round(100 - (diff / currentQ.answer) * 100))
    );
    setAnsweredQuestions((prev) => ({
      ...prev,
      [currentQ.id]: { answer: value, accuracy: pct },
    }));
    setSubmitted(true);
  };

  const goToNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSubmitted(false);
      setValue(Math.round(QUESTIONS[currentIdx + 1].max / 2));
    }
  };

  const completedCount = QUESTIONS.filter(
    (q) => q.completed || answeredQuestions[q.id] !== undefined
  ).length;

  // Compute percentile for histogram display
  const userBinIdx = histogram.findIndex(
    (b) => (userAnswer || value) >= b.min && (userAnswer || value) < b.max
  );
  const answerBinIdx = histogram.findIndex(
    (b) => currentQ.answer >= b.min && currentQ.answer < b.max
  );

  return (
    <div className="estimate-gradient min-h-full flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200/50">
        <div className="text-[12px] text-blue-600">
          <span className="font-semibold">{completedCount}/5</span> answered
        </div>
        <div className="text-[12px] text-blue-500">
          Your accuracy:{" "}
          <span className="font-semibold">
            {completedCount > 0
              ? `${Math.round(
                  (QUESTIONS.filter(
                    (q) =>
                      (q.accuracy && q.accuracy >= 70) ||
                      (answeredQuestions[q.id]?.accuracy &&
                        answeredQuestions[q.id].accuracy >= 70)
                  ).length /
                    completedCount) *
                    100
                )}%`
              : "--"}
          </span>{" "}
          &middot; better than 68% of players
        </div>
      </div>

      {/* Question cards (current) */}
      <div className="flex-1 px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5"
          >
            {/* Question number */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-bold text-blue-600">
                {currentQ.id}
              </span>
              <span className="text-[11px] text-blue-400 uppercase tracking-wide font-medium">
                Question {currentQ.id} of {QUESTIONS.length}
              </span>
            </div>

            <p className="text-[16px] font-medium text-blue-900 mb-5 leading-relaxed">
              {currentQ.text}
            </p>

            {!isCompleted && !submitted ? (
              <>
                {/* Big number display */}
                <div className="text-center mb-4">
                  <div className="text-[40px] font-bold text-blue-700 tabular-nums">
                    {currentQ.formatAnswer(value)}
                  </div>
                  <div className="text-[12px] text-blue-400">your estimate</div>
                </div>

                {/* Slider */}
                <div className="px-2 mb-5">
                  <input
                    type="range"
                    min={0}
                    max={currentQ.max}
                    step={currentQ.step}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-blue-400 mt-1">
                    <span>0</span>
                    <span>{currentQ.formatAnswer(currentQ.max / 2)}</span>
                    <span>{currentQ.formatAnswer(currentQ.max)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-[15px] transition-colors"
                >
                  Lock in estimate
                </button>
              </>
            ) : (
              <>
                {/* Answer reveal */}
                <div className="text-center mb-5">
                  <motion.div
                    className="text-[11px] text-blue-400 mb-1"
                    initial={submitted ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    The actual answer is
                  </motion.div>
                  <motion.div
                    className="text-[44px] font-bold text-blue-700"
                    initial={
                      submitted
                        ? { scale: 0.5, opacity: 0 }
                        : { scale: 1, opacity: 1 }
                    }
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.4,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    {currentQ.formatAnswer(currentQ.answer)}
                  </motion.div>
                  <motion.div
                    className="text-[14px] text-blue-500 mt-1"
                    initial={submitted ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    You guessed{" "}
                    {currentQ.formatAnswer(
                      userAnswer || value
                    )}
                  </motion.div>
                </div>

                {/* Histogram (only for first question index to keep it reasonable) */}
                {currentIdx <= 3 && (
                  <motion.div
                    className="mb-4"
                    initial={submitted ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className="flex items-end gap-[1px] h-[60px]">
                      {histogram.map((bin, i) => {
                        const height = (bin.count / maxCount) * 100;
                        const isUserBin = i === userBinIdx;
                        const isAnswerBin = i === answerBinIdx;
                        return (
                          <motion.div
                            key={i}
                            className={`flex-1 rounded-t-[1px] ${
                              isAnswerBin
                                ? "bg-green-500"
                                : isUserBin
                                ? "bg-blue-600"
                                : "bg-blue-300/60"
                            }`}
                            initial={
                              submitted ? { height: 0 } : { height: `${height}%` }
                            }
                            animate={{ height: `${height}%` }}
                            transition={{
                              delay: submitted ? 1.0 + i * 0.02 : 0,
                              duration: 0.2,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-2 justify-center">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm bg-green-500" />
                        <span className="text-[10px] text-blue-500">
                          Actual
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm bg-blue-600" />
                        <span className="text-[10px] text-blue-500">You</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Accuracy */}
                <motion.div
                  className="text-center bg-blue-50 rounded-xl p-3 border border-blue-200 mb-4"
                  initial={
                    submitted
                      ? { opacity: 0, scale: 0.9 }
                      : { opacity: 1, scale: 1 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <span className="text-[14px] font-semibold text-blue-700">
                    You were closer than {accuracy || 50}% of guessers!
                  </span>
                </motion.div>

                {/* Next button */}
                {currentIdx < QUESTIONS.length - 1 && (
                  <motion.button
                    onClick={goToNext}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-[15px] transition-colors"
                    initial={submitted ? { opacity: 0 } : { opacity: 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                  >
                    Next question &rarr;
                  </motion.button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Question list */}
      <div className="px-4 py-4">
        <div className="bg-white/80 rounded-xl border border-blue-200/50 overflow-hidden">
          <div className="px-3 py-2 border-b border-blue-100/50">
            <span className="text-[11px] font-semibold text-blue-800/50 uppercase tracking-wide">
              All Questions
            </span>
          </div>
          <div className="divide-y divide-blue-50">
            {QUESTIONS.map((q, i) => {
              const isDone =
                q.completed || answeredQuestions[q.id] !== undefined;
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIdx(i);
                    setSubmitted(false);
                    setValue(Math.round(q.max / 2));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isCurrent ? "bg-blue-50/50" : "hover:bg-blue-50/30"
                  }`}
                >
                  <span className="shrink-0">
                    {isDone ? (
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-100" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                  </span>
                  <span
                    className={`text-[12px] flex-1 ${
                      isDone
                        ? "text-gray-500"
                        : isCurrent
                        ? "text-blue-700 font-medium"
                        : "text-gray-600"
                    }`}
                  >
                    Q{q.id}: {q.text.slice(0, 45)}...
                  </span>
                  {isDone && (
                    <span className="text-[11px] text-green-600 font-medium">
                      {q.accuracy || answeredQuestions[q.id]?.accuracy}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
