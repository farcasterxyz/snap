"use client";

import { useMemo } from "react";
import { useStateStore } from "@json-render/react";
import { resolveSnapPaletteHex } from "../lib/resolve-palette-hex";
import { useSnapPreviewPageAccent, useSnapAppearance } from "../accent-context";
import type { PaletteColor } from "@farcaster/snap";
import { PALETTE_DARK_HEX, PALETTE_LIGHT_HEX } from "@farcaster/snap";

/** Readable foreground color (black or white) for a given hex background. */
export function pickForegroundForBg(hex: string): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return "#ffffff";
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? "#0a0a0a" : "#ffffff";
}

const NEUTRAL_LIGHT = {
  text: "#111111",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  muted: "rgba(0,0,0,0.06)",
  surface: "#ffffff",
  inputBorder: "#E5E7EB",
  inputBg: "rgba(0,0,0,0.06)",
} as const;

const NEUTRAL_DARK = {
  text: "#FAFAFA",
  textMuted: "#A1A1AA",
  border: "#2D2D44",
  muted: "rgba(255,255,255,0.03)",
  surface: "#23262f",
  inputBorder: "#3F3F46",
  inputBg: "rgba(255,255,255,0.03)",
} as const;

export type SnapColors = {
  /** Resolved accent hex */
  accent: string;
  /** Readable foreground for accent bg (black or white) */
  accentFg: string;
  /** Primary button hover color */
  accentHover: string;
  /** Secondary/outline button hover color */
  outlineHover: string;
  /** Primary text color */
  text: string;
  /** Muted/secondary text color */
  textMuted: string;
  /** Border color */
  border: string;
  /** Muted background (tracks, containers) */
  muted: string;
  /** Surface/card background */
  surface: string;
  /** Input border */
  inputBorder: string;
  /** Input background */
  inputBg: string;
  /** Current color mode */
  mode: "light" | "dark";
  /** Resolve a palette color name to hex */
  paletteHex: (name: string) => string;
  /** Resolve a palette color name to hex, with accent fallback */
  colorHex: (name: string | undefined) => string;
};

function buildSnapColors(
  accentName: string,
  mode: "light" | "dark",
): SnapColors {
  const accent = resolveSnapPaletteHex(accentName, mode);
  const accentFg = pickForegroundForBg(accent);
  const neutrals = mode === "dark" ? NEUTRAL_DARK : NEUTRAL_LIGHT;
  const paletteMap = mode === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;

  const accentHover =
    mode === "light"
      ? `color-mix(in srgb, ${accent} 82%, #000000)`
      : `color-mix(in srgb, ${accent} 78%, #ffffff)`;

  const outlineHover = `color-mix(in srgb, ${accent} 14%, ${neutrals.surface})`;

  const paletteHex = (name: string) => resolveSnapPaletteHex(name, mode);

  const colorHex = (name: string | undefined) => {
    if (!name || name === "accent") return accent;
    if (Object.hasOwn(paletteMap, name)) return paletteMap[name as PaletteColor];
    return accent;
  };

  return {
    accent,
    accentFg,
    accentHover,
    outlineHover,
    ...neutrals,
    mode,
    paletteHex,
    colorHex,
  };
}

/**
 * Returns fully resolved color values for snap components.
 * All colors are concrete hex values (or color-mix expressions for hover states)
 * so they can be used as inline styles, independent of host app CSS.
 */
export function useSnapColors(): SnapColors {
  const { get } = useStateStore();
  const mode = useSnapAppearance();
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

  return useMemo(() => buildSnapColors(accentName, mode), [accentName, mode]);
}
