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
};

const DEFAULT_LIGHT: SnapNativeColors = {
  bg: "#dfe3e8",
  surface: "#ffffff",
  text: "#111111",
  textSecondary: "#6b7280",
  border: "#d1d5db",
  inputBg: "#ffffff",
  muted: "#f9fafb",
};

const DEFAULT_DARK: SnapNativeColors = {
  bg: "#111318",
  surface: "#1a1d24",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  border: "#374151",
  inputBg: "#1a1d24",
  muted: "#27272a",
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
