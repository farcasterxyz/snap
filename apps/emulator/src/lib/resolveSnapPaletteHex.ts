import {
  PALETTE_DARK_HEX,
  PALETTE_LIGHT_HEX,
  type PaletteColor,
} from "@farcaster/snap";

/** Resolve a snap palette color name to hex for the current shell appearance. */
export function resolveSnapPaletteHex(
  name: string,
  appearance: "light" | "dark",
): string {
  const map = appearance === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;
  return map[name as PaletteColor] ?? map.purple;
}
