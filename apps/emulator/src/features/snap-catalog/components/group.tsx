"use client";

import type { ReactNode } from "react";

export function SnapGroup({ children }: { children?: ReactNode }) {
  return (
    <div className="flex w-full flex-row items-stretch gap-2">{children}</div>
  );
}
