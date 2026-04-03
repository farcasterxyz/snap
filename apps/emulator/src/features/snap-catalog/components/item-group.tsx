"use client";

import type { ReactNode } from "react";
import { ItemGroup } from "@neynar/ui/item";

export function SnapItemGroup({
  children,
}: {
  element: { props: Record<string, unknown> };
  children?: ReactNode;
}) {
  return <ItemGroup>{children}</ItemGroup>;
}
