import type { CSSProperties } from "react";
import { resolveSnapPaletteHex } from "./resolve-palette-hex";

/** Readable on-primary text for hex backgrounds (e.g. amber vs purple). */
function pickForegroundForBg(hex: string): string {
  const h = hex.replace(/^#/, "");
  if (h.length !== 6) return "#ffffff";
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? "#0a0a0a" : "#ffffff";
}

/** Match `globals.css` `--snap-card-bg` so hover tints sit on the preview card. */
const SNAP_CARD_BG: Record<"light" | "dark", string> = {
  light: "#ffffff",
  dark: "#23262f",
};

function snapActionPrimaryHover(
  hex: string,
  appearance: "light" | "dark",
): string {
  return appearance === "light"
    ? `color-mix(in srgb, ${hex} 82%, #000000)`
    : `color-mix(in srgb, ${hex} 78%, #ffffff)`;
}

function snapActionOutlineHover(
  hex: string,
  appearance: "light" | "dark",
): string {
  const card = SNAP_CARD_BG[appearance];
  return `color-mix(in srgb, ${hex} 14%, ${card})`;
}

/**
 * Overrides Neynar / Tailwind theme tokens so `bg-primary`, `border-primary`, etc.
 * use the snap spec accent inside the preview subtree.
 */
export function snapPreviewPrimaryCssProperties(
  accentName: string,
  appearance: "light" | "dark",
): CSSProperties {
  const hex = resolveSnapPaletteHex(accentName, appearance);
  const fg = pickForegroundForBg(hex);
  return {
    "--primary": hex,
    "--primary-foreground": fg,
    "--ring": hex,
    "--color-primary": hex,
    "--color-primary-foreground": fg,
    "--snap-action-primary-hover": snapActionPrimaryHover(hex, appearance),
    "--snap-action-outline-hover": snapActionOutlineHover(hex, appearance),
  } as CSSProperties;
}
