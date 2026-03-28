"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface MiniAppShellProps {
  appName: string;
  creator: string;
  onClose: () => void;
  children: ReactNode;
}

export default function MiniAppShell({
  appName,
  creator,
  onClose,
  children,
}: MiniAppShellProps) {
  return (
    <motion.div
      className="absolute inset-0 z-[60] bg-white rounded-[43px] overflow-hidden flex flex-col"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Top area with dynamic island spacing */}
      <div className="pt-[55px]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
          {/* Left buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Center: app name + creator */}
          <div className="flex flex-col items-center">
            <span className="text-[14px] font-semibold text-gray-900 leading-tight">
              {appName}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400">by {creator}</span>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="#8B5CF6"
              >
                <path d="M8 0L10.2 2.4L13.4 2.1L13.7 5.3L16 7.5L13.7 9.7L13.4 12.9L10.2 12.6L8 15L5.8 12.6L2.6 12.9L2.3 9.7L0 7.5L2.3 5.3L2.6 2.1L5.8 2.4L8 0Z" />
                <path
                  d="M6.5 10.5L4 8L5 7L6.5 8.5L11 4L12 5L6.5 10.5Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>

          {/* Right: menu button */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="6" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="18" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto phone-scroll pb-[30px]">
        {children}
      </div>
    </motion.div>
  );
}
