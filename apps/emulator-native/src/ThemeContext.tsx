import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

const LIGHT = {
  bg: "#dfe3e8",
  surface: "#ffffff",
  text: "#111111",
  textSecondary: "#6b7280",
  border: "#d1d5db",
  inputBg: "#ffffff",
  muted: "#f9fafb",
};

const DARK = {
  bg: "#111318",
  surface: "#1a1d24",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  border: "#374151",
  inputBg: "#1a1d24",
  muted: "#27272a",
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
