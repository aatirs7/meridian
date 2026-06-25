import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getColors, type ThemeColors } from "../../constants/theme";

type ThemeMode = "system" | "dark" | "light";

interface ThemeContextValue {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "meridian_theme_mode";

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  mode: "system",
  colors: getColors(true),
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  // Default to dark — Meridian is a dark app. System/light are opt-in.
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === "system" || saved === "dark" || saved === "light") {
          setModeState(saved);
        }
      } catch {
        // ignore — keep dark default
      }
    })();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  };

  const isDark = useMemo(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return system !== "light";
  }, [mode, system]);

  const colors = useMemo(() => getColors(isDark), [isDark]);

  const value = useMemo(
    () => ({ isDark, mode, colors, setMode }),
    [isDark, mode, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
