import type { CSSProperties } from "react";
import { resolveSnapPaletteHex } from "./resolveSnapPaletteHex";

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
  } as CSSProperties;
}
