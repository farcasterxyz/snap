"use client";

import type { ReactNode } from "react";

export function SnapStack({ children }: { children?: ReactNode }) {
  return <div className="grid w-full gap-3">{children}</div>;
}
