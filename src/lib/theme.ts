export type ThemeName = "light" | "dark";

/** AsyncStorage key shared by ThemeProvider and Android widgets. */
export const THEME_STORAGE_KEY = "thinkdo.theme";

export type ThemePreference = "light" | "dark" | "system";

export function parseThemePreference(
  stored: string | null
): ThemePreference {
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function resolveThemeName(
  preference: ThemePreference,
  systemScheme: string | null | undefined
): ThemeName {
  if (preference === "light" || preference === "dark") return preference;
  return systemScheme === "dark" ? "dark" : "light";
}

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  brand: string;
  action: string;
  actionPressed: string;
  accentSubtle: string;
  accentBorder: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  overlay: string;
  success: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    background: "#F7F6FA",
    surface: "#FFFFFF",
    surfaceMuted: "#EFECF5",
    border: "#E2DEEA",
    textPrimary: "#1C1830",
    textSecondary: "#6B657A",
    textInverse: "#FFFFFF",
    brand: "#8B5CF6",
    action: "#7C3AED",
    actionPressed: "#6D28D9",
    accentSubtle: "#EDE9FE",
    accentBorder: "#C4B5FD",
    danger: "#C63B4A",
    dangerSubtle: "#FCEAED",
    warning: "#B86E00",
    overlay: "#1C183099",
    success: "#2F7D4A",
  },
  dark: {
    background: "#12101A",
    surface: "#1C1828",
    surfaceMuted: "#262233",
    border: "#3A3548",
    textPrimary: "#F3F0FA",
    textSecondary: "#A39BB8",
    textInverse: "#1C1830",
    brand: "#A78BFA",
    action: "#A78BFA",
    actionPressed: "#C4B5FD",
    accentSubtle: "#2E1065",
    accentBorder: "#7C3AED",
    danger: "#E86A76",
    dangerSubtle: "#3A1E24",
    warning: "#E0A84A",
    overlay: "#00000099",
    success: "#5CB87A",
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
export const touchTarget = 44;
export const font = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
} as const;

export const fontSize = {
  meta: 13,
  body: 15,
  title: 16,
  editorTitle: 22,
} as const;

/** Lucide outline icons — stroke 2 by default in AppIcon */
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 22,
} as const;

export const lineHeight = {
  meta: 18,
  body: 21,
  title: 22,
} as const;

export const elevation = {
  capture: {
    shadowColor: "#1C1830",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
