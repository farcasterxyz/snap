/**
 * Named color palette for snaps. Snap authors specify a name; the client maps
 * it to a hex value appropriate for its current light/dark mode.
 *
 * Light-mode hex values (used by emulator):
 *   gray=#8F8F8F  blue=#006BFF  red=#FC0036  amber=#FFAE00
 *   green=#28A948  teal=#00AC96  purple=#8B5CF6  pink=#F32782
 *
 * Dark-mode hex values (for reference; client-owned):
 *   gray=#8F8F8F  blue=#006FFE  red=#F13342  amber=#FFAE00
 *   green=#00AC3A  teal=#00AA96  purple=#A78BFA  pink=#F12B82
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
  gray: "#8F8F8F",
  blue: "#006BFF",
  red: "#FC0036",
  amber: "#FFAE00",
  green: "#28A948",
  teal: "#00AC96",
  purple: "#8B5CF6",
  pink: "#F32782",
};

/** Dark-mode hex for each palette color (reference). */
export const PALETTE_DARK_HEX: Record<PaletteColor, string> = {
  gray: "#8F8F8F",
  blue: "#006FFE",
  red: "#F13342",
  amber: "#FFAE00",
  green: "#00AC3A",
  teal: "#00AA96",
  purple: "#A78BFA",
  pink: "#F12B82",
};

export const PROGRESS_COLOR_VALUES = [
  PALETTE_COLOR_ACCENT,
  ...PALETTE_COLOR_VALUES,
] as const;

export const BAR_CHART_COLOR_VALUES = [
  PALETTE_COLOR_ACCENT,
  ...PALETTE_COLOR_VALUES,
] as const;
