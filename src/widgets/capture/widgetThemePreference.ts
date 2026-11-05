import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import {
  parseThemePreference,
  resolveThemeName,
  type ThemeName,
  type ThemePreference,
} from "@/lib/theme";

/** Same values as in-app Aparência (legacy `follow_app` → `system`). */
export type WidgetThemePreference = ThemePreference;

export function widgetThemeStorageKey(widgetId: number): string {
  return `thinkdo.widget.${widgetId}.theme`;
}

export function parseWidgetThemePreference(
  stored: string | null
): WidgetThemePreference {
  if (stored === "follow_app") return "system";
  return parseThemePreference(stored);
}

export function resolveThemeNameFromWidgetPreference(
  pref: WidgetThemePreference,
  systemScheme: string | null | undefined
): ThemeName {
  return resolveThemeName(pref, systemScheme);
}

export async function loadWidgetThemePreference(
  widgetId: number
): Promise<WidgetThemePreference> {
  try {
    const stored = await AsyncStorage.getItem(widgetThemeStorageKey(widgetId));
    return parseWidgetThemePreference(stored);
  } catch {
    return "system";
  }
}

export async function saveWidgetThemePreference(
  widgetId: number,
  pref: WidgetThemePreference
): Promise<void> {
  await AsyncStorage.setItem(widgetThemeStorageKey(widgetId), pref);
}

export async function clearWidgetThemePreference(
  widgetId: number
): Promise<void> {
  try {
    await AsyncStorage.removeItem(widgetThemeStorageKey(widgetId));
  } catch {
    // best-effort cleanup
  }
}

export async function resolveWidgetInstanceThemeName(
  widgetId: number
): Promise<ThemeName> {
  const pref = await loadWidgetThemePreference(widgetId);
  return resolveThemeNameFromWidgetPreference(
    pref,
    Appearance.getColorScheme()
  );
}
