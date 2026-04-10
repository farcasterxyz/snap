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
