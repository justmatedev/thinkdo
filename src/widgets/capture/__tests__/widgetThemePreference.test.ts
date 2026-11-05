import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearWidgetThemePreference,
  loadWidgetThemePreference,
  parseWidgetThemePreference,
  resolveThemeNameFromWidgetPreference,
  resolveWidgetInstanceThemeName,
  saveWidgetThemePreference,
  widgetThemeStorageKey,
} from "@/widgets/capture/widgetThemePreference";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("widgetThemeStorageKey", () => {
  it("keys by widget id", () => {
    expect(widgetThemeStorageKey(42)).toBe("thinkdo.widget.42.theme");
  });
});

describe("parseWidgetThemePreference", () => {
  it("accepts light, dark, and system", () => {
    expect(parseWidgetThemePreference("light")).toBe("light");
    expect(parseWidgetThemePreference("dark")).toBe("dark");
    expect(parseWidgetThemePreference("system")).toBe("system");
  });
  it("maps legacy follow_app to system", () => {
    expect(parseWidgetThemePreference("follow_app")).toBe("system");
  });
  it("defaults missing or invalid to system", () => {
    expect(parseWidgetThemePreference(null)).toBe("system");
    expect(parseWidgetThemePreference("nope")).toBe("system");
  });
});

describe("resolveThemeNameFromWidgetPreference", () => {
  it("uses explicit prefs", () => {
    expect(resolveThemeNameFromWidgetPreference("light", "dark")).toBe("light");
    expect(resolveThemeNameFromWidgetPreference("dark", "light")).toBe("dark");
  });
  it("system uses device scheme", () => {
    expect(resolveThemeNameFromWidgetPreference("system", "dark")).toBe("dark");
    expect(resolveThemeNameFromWidgetPreference("system", "light")).toBe(
      "light"
    );
  });
});

describe("load/save/clear", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("loads system when empty", async () => {
    expect(await loadWidgetThemePreference(7)).toBe("system");
  });

  it("round-trips a preference", async () => {
    await saveWidgetThemePreference(7, "light");
    expect(await loadWidgetThemePreference(7)).toBe("light");
    expect(await AsyncStorage.getItem("thinkdo.widget.7.theme")).toBe("light");
  });

  it("clears the key", async () => {
    await saveWidgetThemePreference(7, "dark");
    await clearWidgetThemePreference(7);
    expect(await AsyncStorage.getItem("thinkdo.widget.7.theme")).toBeNull();
    expect(await loadWidgetThemePreference(7)).toBe("system");
  });
});

describe("resolveWidgetInstanceThemeName", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("uses stored light", async () => {
    await saveWidgetThemePreference(1, "light");
    expect(await resolveWidgetInstanceThemeName(1)).toBe("light");
  });
});
