import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

const LIGHT = {
  bg: "#ffffff",
  surface: "#f5f5f5",
  text: "#111111",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  inputBg: "#f9fafb",
};

const DARK = {
  bg: "#0a0a0a",
  surface: "#1a1a1a",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  border: "#27272a",
  inputBg: "#18181b",
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
