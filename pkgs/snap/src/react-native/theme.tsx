import { createContext, useContext, useMemo, type ReactNode } from "react";

// ─── Color tokens ─────────────────────────────────────

export type SnapNativeColors = {
  bg: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  muted: string;
  /** Subtle tint for toggle button resting state */
  mutedSubtle: string;
  /** Slightly stronger tint for hover/press state */
  mutedHover: string;
  /** Stronger tint for selected state (toggle group) */
  mutedSelected: string;
};

const DEFAULT_LIGHT: SnapNativeColors = {
  bg: "#dfe3e8",
  surface: "#ffffff",
  text: "#111111",
  textSecondary: "#6b7280",
  border: "#E5E7EB",
  inputBg: "rgba(0,0,0,0.12)",
  muted: "rgba(0,0,0,0.12)",
  mutedSubtle: "rgba(0,0,0,0.06)",
  mutedHover: "rgba(0,0,0,0.10)",
  mutedSelected: "rgba(0,0,0,0.18)",
};

const DEFAULT_DARK: SnapNativeColors = {
  bg: "#111318",
  surface: "#1a1d24",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  border: "#2D2D44",
  inputBg: "rgba(255,255,255,0.03)",
  muted: "rgba(255,255,255,0.03)",
  mutedSubtle: "rgba(255,255,255,0.02)",
  mutedHover: "rgba(255,255,255,0.04)",
  mutedSelected: "rgba(255,255,255,0.10)",
};

// ─── Context ──────────────────────────────────────────

interface SnapThemeValue {
  mode: "light" | "dark";
  colors: SnapNativeColors;
}

const SnapThemeContext = createContext<SnapThemeValue>({
  mode: "dark",
  colors: DEFAULT_DARK,
});

export function SnapThemeProvider({
  appearance,
  colors,
  children,
}: {
  appearance: "light" | "dark";
  colors?: Partial<SnapNativeColors>;
  children: ReactNode;
}) {
  const value = useMemo<SnapThemeValue>(() => {
    const defaults = appearance === "dark" ? DEFAULT_DARK : DEFAULT_LIGHT;
    return {
      mode: appearance,
      colors: colors ? { ...defaults, ...colors } : defaults,
    };
  }, [appearance, colors]);

  return (
    <SnapThemeContext.Provider value={value}>
      {children}
    </SnapThemeContext.Provider>
  );
}

export function useSnapTheme(): SnapThemeValue {
  return useContext(SnapThemeContext);
}
