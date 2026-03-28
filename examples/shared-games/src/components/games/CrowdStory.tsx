"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import GameCardWrapper from "../GameCardWrapper";

interface StoryLine {
  text: string;
  author: string;
}

const STORY_LINES: StoryLine[] = [
  { text: "The last message from Earth arrived at 3:47 AM.", author: "@dwr.eth" },
  { text: 'It was only three words: "They are coming."', author: "@vitalik.eth" },
  { text: "Commander Reyes read it twice, then deleted it.", author: "@linda.eth" },
  { text: "The crew didn't need to know. Not yet.", author: "@ace" },
  { text: "But the ship's AI had already intercepted the transmission.", author: "@ccarella" },
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

export default function CrowdStory({ onOpenApp }: { onOpenApp?: () => void }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);

  const handleVote = (id: string) => {
    if (voted) return;
    setVoted(id);
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  return (
    <GameCardWrapper
      gradientClass="story-gradient"
      headerIcon={"📖"}
      headerTitle="Crowd Story"
      headerSubtitle="The Last Signal"
      stats="312 contributors · Chapter 1, Page 3"
      linkText="Read full story &#8594;"
      likes={203}
      comments={67}
      onOpenApp={onOpenApp}
    >
      {/* Story so far */}
      <div className="space-y-2 mb-4">
        {STORY_LINES.map((line, i) => (
          <div key={i} className="text-[13px] leading-relaxed">
            <span className="text-gray-800 italic">&ldquo;{line.text}&rdquo;</span>
            <span className="text-amber-700/60 text-[11px] ml-1.5">
              {line.author}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-amber-900/10" />
        <span className="text-[11px] text-amber-800/50 font-medium">
          Vote for the next line
        </span>
        <div className="flex-1 h-px bg-amber-900/10" />
      </div>

      {/* Candidate sentences */}
      <div className="space-y-2">
        {candidates.map((candidate) => {
          const isSelected = voted === candidate.id;
          const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
          const pct = Math.round((candidate.votes / totalVotes) * 100);

          return (
            <motion.button
              key={candidate.id}
              onClick={() => handleVote(candidate.id)}
              disabled={voted !== null}
              className={`w-full text-left rounded-lg p-2.5 border transition-all relative overflow-hidden ${
                isSelected
                  ? "border-amber-600 bg-amber-50"
                  : voted
                  ? "border-amber-200/50 bg-amber-50/30 opacity-70"
                  : "border-amber-200 bg-white/60 hover:border-amber-400 hover:bg-white/80"
              }`}
              whileTap={!voted ? { scale: 0.98 } : undefined}
            >
              {/* Progress bar background */}
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

              <div className="relative flex items-start gap-2">
                <span className="text-[11px] font-bold text-amber-700/60 mt-0.5 shrink-0">
                  {candidate.id.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-gray-800 leading-relaxed">
                    &ldquo;{candidate.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-amber-700/50">
                      {candidate.author}
                    </span>
                    {voted && (
                      <motion.span
                        className="text-[11px] font-semibold text-amber-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {candidate.votes} votes ({pct}%)
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Voted confirmation */}
      {voted && (
        <motion.p
          className="text-[11px] text-amber-700/60 mt-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your vote is in! Winning line locks in at midnight.
        </motion.p>
      )}
    </GameCardWrapper>
  );
}
