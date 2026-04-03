import {
  DEFAULT_THEME_ACCENT,
  PALETTE_COLOR_VALUES,
  PALETTE_LIGHT_HEX,
  PALETTE_DARK_HEX,
  type PaletteColor,
} from "@farcaster/snap";
import { useStateStore } from "@json-render/react-native";
import { useColorScheme } from "react-native";

// TODO: export resolveSnapPaletteHex from @farcaster/snap and use it here
function resolveHex(name: string, appearance: "light" | "dark"): string {
  const map = appearance === "dark" ? PALETTE_DARK_HEX : PALETTE_LIGHT_HEX;
  if (Object.hasOwn(map, name)) {
    return map[name as PaletteColor];
  }
  return map.purple;
}

function isPaletteColor(s: string): s is PaletteColor {
  return (PALETTE_COLOR_VALUES as readonly string[]).includes(s);
}

function themeAccentFromStore(get: (path: string) => unknown): PaletteColor {
  const raw = get("/theme/accent");
  if (typeof raw === "string" && isPaletteColor(raw)) {
    return raw;
  }
  return DEFAULT_THEME_ACCENT;
}

export function useSnapPalette() {
  const appearance = useColorScheme() === "dark" ? "dark" : "light";
  const { get } = useStateStore();
  const accentName = themeAccentFromStore(get);
  const accentHex = resolveHex(accentName, appearance);

  const hex = (semantic: string) =>
    semantic === "accent" ? accentHex : resolveHex(semantic, appearance);

  return { appearance, accentName, accentHex, hex };
}

/** `#RRGGBB` + alpha → `rgba(...)` for React Native styles. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) {
    return `rgba(0,0,0,${alpha})`;
  }
  const n = Number.parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function useSnapPreviewChromePalette(themeAccent: string | undefined) {
  const appearance = useColorScheme() === "dark" ? "dark" : "light";
  const accentName =
    typeof themeAccent === "string" && isPaletteColor(themeAccent)
      ? themeAccent
      : DEFAULT_THEME_ACCENT;
  const accentHex = resolveHex(accentName, appearance);
  return { appearance, accentName, accentHex };
}
