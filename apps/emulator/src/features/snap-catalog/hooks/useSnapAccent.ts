"use client";

import type { PaletteColor } from "@farcaster/snap";
import { PALETTE_DARK_HEX, PALETTE_LIGHT_HEX } from "@farcaster/snap";
import { useColorMode } from "@neynar/ui/color-mode";
import { resolveSnapPaletteHex } from "@/lib/resolveSnapPaletteHex";

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
