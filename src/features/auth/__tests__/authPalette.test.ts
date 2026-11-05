import { themes } from "@/lib/theme";
import { getAuthPalette } from "@/features/auth/authPalette";

describe("getAuthPalette", () => {
  it("uses the solid brand hero and fixed white foreground in light mode", () => {
    expect(getAuthPalette(themes.light, "light")).toEqual({
      heroBackground: themes.light.brand,
      logo: themes.light.textInverse,
      tagline: themes.light.textInverse,
      taglineOpacity: 0.88,
      dockBackground: themes.light.background,
      googleBackground: themes.light.surface,
      googlePressed: themes.light.surfaceMuted,
      googleText: themes.light.textPrimary,
      googleBorder: themes.light.border,
      inputBackground: themes.light.surface,
      inputBorder: themes.light.border,
      inputFocusBorder: themes.light.accentBorder,
      inputText: themes.light.textPrimary,
      placeholder: themes.light.textSecondary,
      label: themes.light.textSecondary,
      fieldError: themes.light.danger,
      primaryBackground: themes.light.action,
      primaryPressed: themes.light.actionPressed,
      primaryText: themes.light.textInverse,
      link: themes.light.action,
      divider: themes.light.border,
      dividerText: themes.light.textSecondary,
    });
  });

  it("uses the night hero with accessible foreground in dark mode", () => {
    expect(getAuthPalette(themes.dark, "dark")).toEqual({
      heroBackground: themes.dark.accentSubtle,
      logo: themes.dark.brand,
      tagline: themes.dark.actionPressed,
      taglineOpacity: 1,
      dockBackground: themes.dark.background,
      googleBackground: themes.dark.surfaceMuted,
      googlePressed: themes.dark.surface,
      googleText: themes.dark.textPrimary,
      googleBorder: themes.dark.border,
      inputBackground: themes.dark.surface,
      inputBorder: themes.dark.border,
      inputFocusBorder: themes.dark.accentBorder,
      inputText: themes.dark.textPrimary,
      placeholder: themes.dark.textSecondary,
      label: themes.dark.textSecondary,
      fieldError: themes.dark.danger,
      primaryBackground: themes.dark.action,
      primaryPressed: themes.dark.actionPressed,
      primaryText: themes.dark.textInverse,
      link: themes.dark.action,
      divider: themes.dark.border,
      dividerText: themes.dark.textSecondary,
    });
  });
});
