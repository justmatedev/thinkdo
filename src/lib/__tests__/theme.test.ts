import {
  elevation,
  fontSize,
  iconSize,
  lineHeight,
  parseThemePreference,
  resolveThemeName,
} from "@/lib/theme";

describe("theme identity tokens", () => {
  it("exposes the visual-identity type scale", () => {
    expect(fontSize).toEqual({
      meta: 13,
      body: 15,
      title: 16,
      editorTitle: 22,
    });
    expect(iconSize).toEqual({
      xs: 14,
      sm: 16,
      md: 20,
      lg: 22,
    });
    expect(lineHeight).toEqual({
      meta: 18,
      body: 21,
      title: 22,
    });
  });

  it("exposes a light capture elevation", () => {
    expect(elevation.capture.elevation).toBe(2);
    expect(elevation.capture.shadowOpacity).toBe(0.08);
  });
});

describe("parseThemePreference", () => {
  it("accepts light, dark, and system", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("defaults invalid or missing values to system", () => {
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("nope")).toBe("system");
    expect(parseThemePreference("")).toBe("system");
  });
});

describe("resolveThemeName", () => {
  it("returns locked light or dark regardless of system", () => {
    expect(resolveThemeName("light", "dark")).toBe("light");
    expect(resolveThemeName("dark", "light")).toBe("dark");
  });

  it("follows system when preference is system", () => {
    expect(resolveThemeName("system", "dark")).toBe("dark");
    expect(resolveThemeName("system", "light")).toBe("light");
  });

  it("treats null or unknown system scheme as light", () => {
    expect(resolveThemeName("system", null)).toBe("light");
    expect(resolveThemeName("system", undefined)).toBe("light");
    expect(resolveThemeName("system", "nope")).toBe("light");
  });
});
