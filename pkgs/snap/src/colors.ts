/**
 * Named color palette for snaps. Snap authors specify a name; the client maps
 * it to a hex value appropriate for its current light/dark mode.
 *
 * Light-mode hex values (used by emulator):
 *   gray=#6E6A86  blue=#286983  red=#B4637A  amber=#EA9D34
 *   green=#3E8F8F  teal=#56949F  purple=#907AA9  pink=#D7827E
 *
 * Dark-mode hex values (for reference; client-owned):
 *   gray=#908CAA  blue=#9CCFD8  red=#EB6F92  amber=#F6C177
 *   green=#56D4A4  teal=#3E8FB0  purple=#C4A7E7  pink=#EBBCBA
 */
export const PALETTE_COLOR = {
  gray: "gray",
  blue: "blue",
  red: "red",
  amber: "amber",
  green: "green",
  teal: "teal",
  purple: "purple",
  pink: "pink",
} as const;

export const PALETTE_COLOR_ACCENT = "accent" as const;

export const DEFAULT_THEME_ACCENT = PALETTE_COLOR.purple;

export const PALETTE_COLOR_VALUES = [
  PALETTE_COLOR.gray,
  PALETTE_COLOR.blue,
  PALETTE_COLOR.red,
  PALETTE_COLOR.amber,
  PALETTE_COLOR.green,
  PALETTE_COLOR.teal,
  PALETTE_COLOR.purple,
  PALETTE_COLOR.pink,
] as const;

export type PaletteColor = (typeof PALETTE_COLOR_VALUES)[number];

/** Strict `#rrggbb` literal used by cell_grid (and clients that accept hex). */
const SNAP_HEX_6 = /^#[0-9a-fA-F]{6}$/;

export function isSnapHexColorString(s: string): boolean {
  return SNAP_HEX_6.test(s.trim());
}

/**
 * Resolve a snap color token for inline styles: `accent`, palette names, or
 * literal `#rrggbb`. Unknown values fall back to `accentHex` (same as legacy
 * `colorHex` behavior for non-hex strings).
 */
export function resolveSnapColorHex(
  color: string | undefined,
  opts: { accentHex: string; appearance: "light" | "dark" },
): string {
  if (!color || color === PALETTE_COLOR_ACCENT) return opts.accentHex;
  const trimmed = color.trim();
  if (isSnapHexColorString(trimmed)) return trimmed;
  const map =
    opts.appearance === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;
  if (Object.hasOwn(map, trimmed)) {
    return map[trimmed as PaletteColor];
  }
  return opts.accentHex;
}

/** Light-mode hex for each palette color (emulator / reference client). */
export const PALETTE_LIGHT_HEX: Record<PaletteColor, string> = {
  gray: "#6E6A86",
  blue: "#286983",
  red: "#B4637A",
  amber: "#EA9D34",
  green: "#3E8F8F",
  teal: "#56949F",
  purple: "#907AA9",
  pink: "#D7827E",
};

/** Dark-mode hex for each palette color (reference). */
export const PALETTE_DARK_HEX: Record<PaletteColor, string> = {
  gray: "#908CAA",
  blue: "#9CCFD8",
  red: "#EB6F92",
  amber: "#F6C177",
  green: "#56D4A4",
  teal: "#3E8FB0",
  purple: "#C4A7E7",
  pink: "#EBBCBA",
};

export const PROGRESS_COLOR_VALUES = [
  PALETTE_COLOR_ACCENT,
  ...PALETTE_COLOR_VALUES,
] as const;

export const BAR_CHART_COLOR_VALUES = [
  PALETTE_COLOR_ACCENT,
  ...PALETTE_COLOR_VALUES,
] as const;
