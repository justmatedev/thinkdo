import { Appearance } from "react-native";
import type { ColorProp } from "react-native-android-widget";
import { themes, THEME_STORAGE_KEY, type ThemeName } from "@/lib/theme";

export type CaptureWidgetPalette = {
  background: ColorProp;
  text: ColorProp;
  textMuted: ColorProp;
  accent: ColorProp;
  border: ColorProp;
};

export function resolveThemeNameFromStored(
  stored: string | null,
  system: ThemeName
): ThemeName {
  if (stored === "light" || stored === "dark") return stored;
  return system;
}

/** Surface tile: light/dark app surfaces with brand accent (mark / +). */
export function captureWidgetPalette(themeName: ThemeName): CaptureWidgetPalette {
  const t = themes[themeName];
  return {
    background: t.surface as ColorProp,
    text: t.textPrimary as ColorProp,
    textMuted: t.textSecondary as ColorProp,
    accent: t.brand as ColorProp,
    border: t.border as ColorProp,
  };
}

export async function resolveCaptureWidgetThemeName(): Promise<ThemeName> {
  const system: ThemeName =
    Appearance.getColorScheme() === "dark" ? "dark" : "light";
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return resolveThemeNameFromStored(stored, system);
  } catch {
    return system;
  }
}
