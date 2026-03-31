"use client";

import { useMemo, type CSSProperties } from "react";
import { useStateStore } from "@json-render/react";
import type { PaletteColor } from "@farcaster/snap";
import { PALETTE_DARK_HEX, PALETTE_LIGHT_HEX } from "@farcaster/snap";
import { useColorMode } from "@neynar/ui/color-mode";
import { resolveSnapPaletteHex } from "@/lib/resolveSnapPaletteHex";
import { snapPreviewPrimaryCssProperties } from "@/lib/snapPreviewPrimaryCss";
import { useSnapPreviewPageAccent } from "../SnapPreviewAccentContext";

/**
 * CSS variables so Neynar controls (`bg-primary`, `data-checked:bg-primary`, etc.)
 * use the snap `theme.accent` inside json-render catalog components.
 */
export function useSnapAccentScopeStyle(): CSSProperties {
  const { get } = useStateStore();
  const { mode } = useColorMode();
  const pageAccent = useSnapPreviewPageAccent();
  const fromState = get("/theme/accent");
  const accentRaw =
    (typeof pageAccent === "string" && pageAccent.length > 0
      ? pageAccent
      : fromState) ?? undefined;
  const accentName =
    typeof accentRaw === "string" && accentRaw.length > 0
      ? accentRaw
      : "purple";
  return useMemo(
    () => snapPreviewPrimaryCssProperties(accentName, mode),
    [accentName, mode],
  );
}

/** Active snap palette table for the current docs shell theme. */
export function useSnapPalette(): {
  hex: (name: string) => string;
  map: Record<PaletteColor, string>;
  theme: "light" | "dark";
} {
  const { mode } = useColorMode();
  const map = mode === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;
  const hex = (name: string) => resolveSnapPaletteHex(name, mode);
  return { hex, map, theme: mode };
}
