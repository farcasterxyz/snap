"use client";

import { createContext, useContext, type ReactNode } from "react";

export type SnapStackDirection = "vertical" | "horizontal";

const SnapStackDirectionContext = createContext<SnapStackDirection | undefined>(
  undefined,
);

export function SnapStackDirectionProvider({
  direction,
  children,
}: {
  direction: SnapStackDirection;
  children: ReactNode;
}) {
  return (
    <SnapStackDirectionContext.Provider value={direction}>
      {children}
    </SnapStackDirectionContext.Provider>
  );
}

export function useSnapStackDirection(): SnapStackDirection | undefined {
  return useContext(SnapStackDirectionContext);
}
