"use client";

import { ReactNode } from "react";

interface GameCardWrapperProps {
  gradientClass: string;
  headerIcon: string;
  headerTitle: string;
  headerSubtitle: string;
  stats: string;
  linkText: string;
  children: ReactNode;
  likes?: number;
  comments?: number;
  recasts?: number;
  onOpenApp?: () => void;
}

export default function GameCardWrapper({
  gradientClass,
  headerIcon,
  headerTitle,
  headerSubtitle,
  stats,
  linkText,
  children,
  likes = 0,
  comments = 0,
  onOpenApp,
}: GameCardWrapperProps) {
  return (
    <div className="border-b border-gray-100">
      <div className={`mx-3 my-3 rounded-2xl overflow-hidden ${gradientClass}`}>
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{headerIcon}</span>
            <div>
              <div className="font-semibold text-[14px] leading-tight">{headerTitle}</div>
              <div className="text-[11px] opacity-60">{headerSubtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 live-pulse" />
            <span className="text-[11px] opacity-60">Live</span>
          </div>
        </div>

        {/* Game content */}
        <div className="px-4 pb-3">
          {children}
        </div>

        {/* Stats */}
        <div className="px-4 pb-2">
          <p className="text-[11px] opacity-50">{stats}</p>
        </div>

        {/* Open link */}
        <div className="px-4 pb-3">
          <button
            onClick={onOpenApp}
            className="text-[13px] font-medium text-[var(--fc-purple)] hover:underline"
          >
            {linkText}
          </button>
        </div>
      </div>

      {/* Engagement row */}
      <div className="flex items-center gap-6 px-4 pb-3 text-gray-400">
        <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {comments > 0 && comments}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </button>
        <button className="flex items-center gap-1.5 text-[13px] hover:text-[#EF4444]">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likes > 0 && likes}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] hover:text-gray-600 ml-auto">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
