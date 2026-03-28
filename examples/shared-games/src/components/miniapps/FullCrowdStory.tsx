"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Avatar from "../Avatar";

interface StoryLine {
  text: string;
  author: string;
}

const STORY_LINES: StoryLine[] = [
  {
    text: "The last message from Earth arrived at 3:47 AM.",
    author: "@dwr.eth",
  },
  {
    text: 'It was only three words: "They are coming."',
    author: "@vitalik.eth",
  },
  {
    text: "Commander Reyes read it twice, then deleted it.",
    author: "@linda.eth",
  },
  {
    text: "The crew didn't need to know. Not yet.",
    author: "@ace",
  },
  {
    text: "But the ship's AI had already intercepted the transmission.",
    author: "@ccarella",
  },
];

interface Candidate {
  id: string;
  text: string;
  author: string;
  votes: number;
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "a",
    text: "It began composing a reply before anyone could stop it.",
    author: "@ted",
    votes: 67,
  },
  {
    id: "b",
    text: '"I recommend immediate course correction," it said calmly.',
    author: "@binji.eth",
    votes: 43,
  },
  {
    id: "c",
    text: "In the server room, a light that had been off for years flickered on.",
    author: "@0xdesigner",
    votes: 89,
  },
];

export default function FullCrowdStory() {
  const [voted, setVoted] = useState<string | null>(null);
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [customText, setCustomText] = useState("");

  const handleVote = (id: string) => {
    if (voted) return;
    setVoted(id);
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="story-gradient min-h-full flex flex-col">
      {/* Chapter nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/50">
        <span className="text-[13px] font-medium text-amber-800">
          Chapter 1 &middot; Page 3 of ?
        </span>
        <button className="text-[12px] text-amber-600 font-medium hover:underline">
          Read from the beginning &rarr;
        </button>
      </div>

      {/* Story title */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[20px] font-bold text-gray-900">
          The Last Signal
        </h2>
        <p className="text-[12px] text-amber-700/50 mt-1">
          312 contributors &middot; 5 lines written
        </p>
      </div>

      {/* Full story with avatars */}
      <div className="px-5 space-y-4 pb-6">
        {STORY_LINES.map((line, i) => (
          <motion.div
            key={i}
            className="flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Avatar name={line.author.replace("@", "")} size={32} />
            <div className="flex-1">
              <p className="text-[15px] leading-relaxed text-gray-800 italic">
                &ldquo;{line.text}&rdquo;
              </p>
              <span className="text-[11px] text-amber-700/50 mt-0.5 block">
                {line.author}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-5 mb-5">
        <div className="flex-1 h-px bg-amber-900/10" />
        <span className="text-[12px] text-amber-800/50 font-semibold">
          Vote for the next line
        </span>
        <div className="flex-1 h-px bg-amber-900/10" />
      </div>

      {/* Vote cards */}
      <div className="px-5 space-y-3 pb-4">
        {candidates.map((candidate) => {
          const isSelected = voted === candidate.id;
          const pct = Math.round((candidate.votes / totalVotes) * 100);

          return (
            <motion.button
              key={candidate.id}
              onClick={() => handleVote(candidate.id)}
              disabled={voted !== null}
              className={`w-full text-left rounded-xl p-4 border transition-all relative overflow-hidden ${
                isSelected
                  ? "border-amber-600 bg-amber-50 shadow-sm"
                  : voted
                  ? "border-amber-200/50 bg-amber-50/30 opacity-60"
                  : "border-amber-200 bg-white/80 hover:border-amber-400 hover:shadow-sm"
              }`}
              whileTap={!voted ? { scale: 0.98 } : undefined}
            >
              {/* Progress bar */}
              {voted && (
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? "bg-amber-200/40" : "bg-amber-100/30"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}

              <div className="relative">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[12px] font-bold text-amber-700/60 mt-0.5 shrink-0">
                    {candidate.id.toUpperCase()}
                  </span>
                  <p className="text-[14px] text-gray-800 leading-relaxed italic">
                    &ldquo;{candidate.text}&rdquo;
                  </p>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={candidate.author.replace("@", "")}
                      size={20}
                    />
                    <span className="text-[11px] text-amber-700/50">
                      {candidate.author}
                    </span>
                  </div>
                  {voted && (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-24 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-amber-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-[12px] font-semibold text-amber-800">
                        {candidate.votes} ({pct}%)
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Voted confirmation */}
      {voted && (
        <motion.p
          className="text-[12px] text-amber-700/60 text-center pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your vote is in! Winning line locks in at midnight.
        </motion.p>
      )}

      {/* Custom continuation input */}
      <div className="px-5 pb-6">
        <div className="bg-white/60 rounded-xl border border-amber-200 p-3">
          <p className="text-[12px] text-amber-700/60 mb-2 font-medium">
            Or write your own continuation
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type the next line of the story..."
              className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 placeholder:text-amber-300 focus:outline-none focus:border-amber-400"
            />
            <button
              disabled={customText.length === 0}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold px-4 py-2 rounded-lg text-[13px] transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
