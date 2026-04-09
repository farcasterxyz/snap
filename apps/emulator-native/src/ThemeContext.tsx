import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

const LIGHT = {
  bg: "#dfe3e8",
  surface: "#ffffff",
  text: "#111111",
  textSecondary: "#6b7280",
  border: "#E5E7EB",
  inputBg: "rgba(0,0,0,0.06)",
  muted: "rgba(0,0,0,0.08)",
  mutedSubtle: "rgba(0,0,0,0.04)",
  mutedHover: "rgba(0,0,0,0.12)",
  mutedSelected: "rgba(0,0,0,0.16)",
};

const DARK = {
  bg: "#111318",
  surface: "#1a1d24",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  border: "#2D2D44",
  inputBg: "rgba(255,255,255,0.04)",
  muted: "rgba(255,255,255,0.06)",
  mutedSubtle: "rgba(255,255,255,0.03)",
  mutedHover: "rgba(255,255,255,0.08)",
  mutedSelected: "rgba(255,255,255,0.12)",
};

export type ThemeColors = typeof LIGHT;

interface ThemeContextValue {
  mode: "light" | "dark";
  colors: ThemeColors;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: LIGHT,
  toggleMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<"light" | "dark" | null>(null);

  const mode = override ?? (systemScheme === "dark" ? "dark" : "light");
  const colors = mode === "dark" ? DARK : LIGHT;

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleMode: () =>
        setOverride((prev) => {
          if (prev === null) return systemScheme === "dark" ? "light" : "dark";
          return prev === "dark" ? "light" : "dark";
        }),
    }),
    [mode, colors, systemScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
