"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCardWrapper from "../GameCardWrapper";

const ACTUAL_ANSWER = 80000;

// Generate a mock histogram (bell curve-ish centered around 60k)
function generateHistogramBars(): { min: number; max: number; count: number }[] {
  const bins: { min: number; max: number; count: number }[] = [];
  const binWidth = 25000;
  for (let i = 0; i < 500000; i += binWidth) {
    const center = 60000;
    const dist = Math.abs(i + binWidth / 2 - center);
    const base = Math.max(5, Math.round(200 * Math.exp(-(dist * dist) / (2 * 80000 * 80000))));
    // Add some noise
    const noise = Math.round((Math.sin(i * 0.0001) + 1) * 15);
    bins.push({ min: i, max: i + binWidth, count: base + noise });
  }
  return bins;
}

export default function EstimateChallenge({ onOpenApp }: { onOpenApp?: () => void }) {
  const [value, setValue] = useState(50000);
  const [submitted, setSubmitted] = useState(false);
  const histogram = useMemo(() => generateHistogramBars(), []);
  const maxCount = Math.max(...histogram.map((b) => b.count));

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
  };

  const userBinIdx = histogram.findIndex(
    (b) => value >= b.min && value < b.max
  );
  const answerBinIdx = histogram.findIndex(
    (b) => ACTUAL_ANSWER >= b.min && ACTUAL_ANSWER < b.max
  );

  // Calculate percentile (how close user was)
  const diff = Math.abs(value - ACTUAL_ANSWER);
  const percentileCloser = Math.min(95, Math.max(15, Math.round(100 - (diff / ACTUAL_ANSWER) * 100)));

  return (
    <GameCardWrapper
      gradientClass="estimate-gradient"
      headerIcon={"📊"}
      headerTitle="Estimate Challenge"
      headerSubtitle="Day 5"
      stats="3,891 estimates submitted"
      linkText="Play more &#8594;"
      likes={112}
      comments={28}
      onOpenApp={onOpenApp}
    >
      <p className="text-[14px] font-medium text-blue-900 mb-3">
        How many daily active users does Farcaster have?
      </p>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="input"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Big number display */}
            <div className="text-center mb-3">
              <div className="text-[32px] font-bold text-blue-700 tabular-nums">
                {value.toLocaleString()}
              </div>
              <div className="text-[11px] text-blue-400">your estimate</div>
            </div>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min={0}
                max={500000}
                step={1000}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-blue-400 mt-1">
                <span>0</span>
                <span>250K</span>
                <span>500K</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-[14px] transition-colors"
            >
              Lock in estimate
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Answer reveal */}
            <div className="text-center mb-4">
              <motion.div
                className="text-[11px] text-blue-400 mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                The actual answer is
              </motion.div>
              <motion.div
                className="text-[36px] font-bold text-blue-700"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {ACTUAL_ANSWER.toLocaleString()}
              </motion.div>
              <motion.div
                className="text-[13px] text-blue-500 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                You guessed {value.toLocaleString()}
              </motion.div>
            </div>

            {/* Histogram */}
            <motion.div
              className="mb-3"
              initial={{ opacity: 0 }}
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
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 1.0 + i * 0.02, duration: 0.2 }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-blue-400 mt-1">
                <span>0</span>
                <span>250K</span>
                <span>500K</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-green-500" />
                  <span className="text-[10px] text-blue-500">Actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-blue-600" />
                  <span className="text-[10px] text-blue-500">You</span>
                </div>
              </div>
            </motion.div>

            {/* Percentile */}
            <motion.div
              className="text-center bg-blue-50 rounded-lg p-2.5 border border-blue-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              <span className="text-[13px] font-semibold text-blue-700">
                You were closer than {percentileCloser}% of guessers!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameCardWrapper>
  );
}
