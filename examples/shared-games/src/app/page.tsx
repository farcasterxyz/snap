"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import PhoneFrame from "@/components/PhoneFrame";
import FeedHeader from "@/components/FeedHeader";
import BottomNav from "@/components/BottomNav";
import CastCard from "@/components/CastCard";
import CollaborativeWordle from "@/components/games/CollaborativeWordle";
import PixelCanvas from "@/components/games/PixelCanvas";
import CrowdStory from "@/components/games/CrowdStory";
import EstimateChallenge from "@/components/games/EstimateChallenge";
import PredictionTournament from "@/components/games/PredictionTournament";
import MiniAppShell from "@/components/MiniAppShell";
import FullWordle from "@/components/miniapps/FullWordle";
import FullPixelCanvas from "@/components/miniapps/FullPixelCanvas";
import FullCrowdStory from "@/components/miniapps/FullCrowdStory";
import FullEstimate from "@/components/miniapps/FullEstimate";
import FullPrediction from "@/components/miniapps/FullPrediction";

type MiniAppType =
  | "wordle"
  | "canvas"
  | "story"
  | "estimate"
  | "prediction"
  | null;

const MINI_APP_CONFIG: Record<
  Exclude<MiniAppType, null>,
  { name: string; creator: string }
> = {
  wordle: { name: "Daily Wordle", creator: "@wordlebot" },
  canvas: { name: "Pixel Canvas", creator: "@canvasbot" },
  story: { name: "Crowd Story", creator: "@storybot" },
  estimate: { name: "Estimate Challenge", creator: "@trivia" },
  prediction: { name: "Predictions", creator: "@oracle" },
};

function MiniAppContent({ type }: { type: Exclude<MiniAppType, null> }) {
  switch (type) {
    case "wordle":
      return <FullWordle />;
    case "canvas":
      return <FullPixelCanvas />;
    case "story":
      return <FullCrowdStory />;
    case "estimate":
      return <FullEstimate />;
    case "prediction":
      return <FullPrediction />;
  }
}

export default function Page() {
  const [openApp, setOpenApp] = useState<MiniAppType>(null);

  const miniAppOverlay = (
    <AnimatePresence>
      {openApp && (
        <MiniAppShell
          key={openApp}
          appName={MINI_APP_CONFIG[openApp].name}
          creator={MINI_APP_CONFIG[openApp].creator}
          onClose={() => setOpenApp(null)}
        >
          <MiniAppContent type={openApp} />
        </MiniAppShell>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative">
      {/* Description overlay */}
      <div className="fixed top-8 left-8 max-w-xs z-50 hidden xl:block">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Shared Games</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Collaborative games in the Farcaster feed where each user contributes
          ONE move. The game progresses as more people interact.
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-sm wordle-gradient border border-gray-400" />
            <span>Wordle — crowd-sourced guesses</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-sm canvas-gradient border border-gray-300" />
            <span>Pixel Canvas — collaborative art</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-sm story-gradient border border-amber-200" />
            <span>Crowd Story — vote on next lines</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-sm estimate-gradient border border-blue-200" />
            <span>Estimate — guess the number</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-sm prediction-gradient border border-green-200" />
            <span>Prediction — tournament brackets</span>
          </div>
        </div>
      </div>

      <PhoneFrame overlay={miniAppOverlay}>
        <FeedHeader />
        <div className="flex-1">
          {/* Section header */}
          <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[15px]">&#x1F3AE;</span>
              <span className="text-[14px] font-semibold text-gray-700">
                Shared Games
              </span>
              <span className="text-[12px] text-gray-400">
                · 5 active games
              </span>
            </div>
          </div>

          <CollaborativeWordle onOpenApp={() => setOpenApp("wordle")} />

          <CastCard
            username="dwr.eth"
            time="2h"
            text={"The crowd Wordle is on attempt 4 and they're SO close. Love watching this play out."}
            verified
            channel="games"
            likes={47}
            comments={12}
          />

          <PixelCanvas onOpenApp={() => setOpenApp("canvas")} />

          <CastCard
            username="jessepollak"
            time="4h"
            text={"My pixel canvas faction is trying to draw the Base logo. We need reinforcements in the bottom right corner."}
            verified
            channel="base"
            likes={31}
            comments={8}
          />

          <CrowdStory onOpenApp={() => setOpenApp("story")} />

          <EstimateChallenge onOpenApp={() => setOpenApp("estimate")} />

          <PredictionTournament onOpenApp={() => setOpenApp("prediction")} />
        </div>
        <BottomNav />
      </PhoneFrame>
    </div>
  );
}
