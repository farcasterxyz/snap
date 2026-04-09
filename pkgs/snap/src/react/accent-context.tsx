"use client";

import { createContext, useContext, type ReactNode } from "react";

type SnapPreviewContextValue = {
  /** From loaded snap `page.theme.accent` (undefined if the snap omits it). */
  pageAccent: string | undefined;
  /** Light/dark appearance passed from SnapCard. */
  appearance: "light" | "dark";
};

const SnapPreviewContext = createContext<SnapPreviewContextValue | null>(null);

export function SnapPreviewAccentProvider({
  pageAccent,
  appearance = "dark",
  children,
}: {
  pageAccent: string | undefined;
  appearance?: "light" | "dark";
  children: ReactNode;
}) {
  return (
    <SnapPreviewContext.Provider value={{ pageAccent, appearance }}>
      {children}
    </SnapPreviewContext.Provider>
  );
}

export function useSnapPreviewPageAccent(): string | undefined {
  return useContext(SnapPreviewContext)?.pageAccent;
}

export function useSnapAppearance(): "light" | "dark" {
  return useContext(SnapPreviewContext)?.appearance ?? "dark";
}
