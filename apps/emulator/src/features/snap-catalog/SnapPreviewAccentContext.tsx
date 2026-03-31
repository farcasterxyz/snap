"use client";

import { createContext, useContext, type ReactNode } from "react";

type SnapPreviewAccentContextValue = {
  /** From loaded snap `page.theme.accent` (undefined if the snap omits it). */
  pageAccent: string | undefined;
};

const SnapPreviewAccentContext =
  createContext<SnapPreviewAccentContextValue | null>(null);

export function SnapPreviewAccentProvider({
  pageAccent,
  children,
}: {
  pageAccent: string | undefined;
  children: ReactNode;
}) {
  return (
    <SnapPreviewAccentContext.Provider value={{ pageAccent }}>
      {children}
    </SnapPreviewAccentContext.Provider>
  );
}

export function useSnapPreviewPageAccent(): string | undefined {
  return useContext(SnapPreviewAccentContext)?.pageAccent;
}
