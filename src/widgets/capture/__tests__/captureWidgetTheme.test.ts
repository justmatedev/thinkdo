import { themes } from "@/lib/theme";
import {
  captureWidgetPalette,
  resolveThemeNameFromStored,
} from "@/widgets/capture/captureWidgetTheme";

describe("resolveThemeNameFromStored", () => {
  it("uses saved light/dark", () => {
    expect(resolveThemeNameFromStored("dark", "light")).toBe("dark");
    expect(resolveThemeNameFromStored("light", "dark")).toBe("light");
  });
  it("falls back to system when missing, invalid, or explicit system", () => {
    expect(resolveThemeNameFromStored(null, "dark")).toBe("dark");
    expect(resolveThemeNameFromStored("nope", "light")).toBe("light");
    expect(resolveThemeNameFromStored("system", "dark")).toBe("dark");
    expect(resolveThemeNameFromStored("system", "light")).toBe("light");
  });
});

describe("captureWidgetPalette", () => {
  it("uses surface backgrounds with brand accent", () => {
    expect(captureWidgetPalette("light")).toEqual({
      background: themes.light.surface,
      text: themes.light.textPrimary,
      textMuted: themes.light.textSecondary,
      accent: themes.light.brand,
      border: themes.light.border,
    });
    expect(captureWidgetPalette("dark")).toEqual({
      background: themes.dark.surface,
      text: themes.dark.textPrimary,
      textMuted: themes.dark.textSecondary,
      accent: themes.dark.brand,
      border: themes.dark.border,
    });
  });
});
