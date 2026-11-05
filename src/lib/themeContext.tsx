import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import {
  parseThemePreference,
  resolveThemeName,
  themes,
  THEME_STORAGE_KEY,
  type ThemeColors,
  type ThemeName,
  type ThemePreference,
} from "@/lib/theme";
import { refreshCaptureWidgets } from "@/widgets/refreshWidgets";

type ThemeContextValue = {
  colors: ThemeColors;
  themeName: ThemeName;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>("system");
  const previousSystemScheme = useRef(systemScheme);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      setPreferenceState(parseThemePreference(saved));
    });
  }, []);

  // Native dialogs on Android follow Appearance, not the JS color palette.
  useEffect(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      Appearance.setColorScheme(preference === "system" ? "unspecified" : preference);
    }
  }, [preference]);

  // Follow-app widgets: refresh when the device day/night mode changes.
  useEffect(() => {
    const previous = previousSystemScheme.current;
    previousSystemScheme.current = systemScheme;
    if (Platform.OS !== "android") return;
    if (preference !== "system") return;
    if (previous === systemScheme) return;
    refreshCaptureWidgets();
  }, [systemScheme, preference]);

  const themeName = resolveThemeName(preference, systemScheme);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    if (Platform.OS === "android") refreshCaptureWidgets();
  };

  return (
    <ThemeContext.Provider
      value={{
        colors: themes[themeName],
        themeName,
        preference,
        setPreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
