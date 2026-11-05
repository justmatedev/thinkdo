import AsyncStorage from "@react-native-async-storage/async-storage";
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@expo-google-fonts/poppins", () => ({
  useFonts: () => [true],
  Poppins_400Regular: 1, Poppins_500Medium: 2, Poppins_600SemiBold: 3,
}));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: require("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("react-native-android-widget", () => ({ WidgetPreview: () => null }));
jest.mock("@/widgets/snapshot/authenticatedSnapshot", () => ({
  readAuthenticatedInboxSnapshot: async () => ({ uid: null, signedIn: false, updatedAt: 0, items: [] }),
}));
jest.mock("@/lib/themeContext", () => ({
  ThemeProvider: ({ children }: { children: import("react").ReactNode }) => children,
  useTheme: () => ({ colors: require("@/lib/theme").themes.light }),
}));
jest.mock("@/components/ui/AppIcon", () => ({ AppIcon: () => null }));

import { WidgetConfigScreen } from "@/widgets/android/WidgetConfigScreen";
import { loadWidgetThemePreference } from "@/widgets/capture/widgetThemePreference";

let tree: ReactTestRenderer;
let props: WidgetConfigurationScreenProps;
async function press(label: string) {
  await act(async () => tree.root.findByProps({ accessibilityLabel: label }).props.onPress());
}
beforeEach(async () => {
  await AsyncStorage.clear();
  props = {
    widgetInfo: {
      widgetId: 7, widgetName: "Capture", width: 70, height: 70,
      screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 1, densityDpi: 160 },
    },
    renderWidget: jest.fn(), setResult: jest.fn(),
  };
  await act(async () => { tree = create(createElement(WidgetConfigScreen, props)); });
});
afterEach(() => {
  act(() => tree.unmount());
  jest.restoreAllMocks();
});

test("a failed theme save shows an error and retries the selected theme without closing", async () => {
  await press("Tema Escuro");
  jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("storage unavailable"));
  await press("Confirmar");
  expect(props.setResult).not.toHaveBeenCalled();
  expect(props.renderWidget).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("Não foi possível");
  expect(tree.root.findByProps({ accessibilityLabel: "Tema Escuro" }).props.accessibilityState.selected).toBe(true);
  await press("Tentar novamente");
  expect(await loadWidgetThemePreference(7)).toBe("dark");
  expect(props.setResult).toHaveBeenCalledWith("ok");
  expect(props.renderWidget).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByProps({ accessibilityRole: "alert" })).toHaveLength(0);
});

test("a rendering failure also keeps configuration open for retry", async () => {
  (props.renderWidget as jest.Mock).mockImplementationOnce(() => { throw new Error("render failed"); });
  await press("Confirmar");
  expect(props.setResult).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("Não foi possível");
  await press("Tentar novamente");
  expect(props.setResult).toHaveBeenCalledWith("ok");
});
