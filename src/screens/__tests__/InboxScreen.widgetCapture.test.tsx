import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TextInput } from "react-native";

const mockListeners = new Set<(event: { url: string }) => void>();
const mockRouter = { setParams: jest.fn(), push: jest.fn() };
let mockOnline = true;
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (effect: () => void) => require("react").useEffect(effect, [effect]),
}));
jest.mock("expo-linking", () => ({
  addEventListener: (_type: string, listener: (event: { url: string }) => void) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  },
}));
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { ScrollView: require("react-native").ScrollView },
  useAnimatedRef: () => require("react").useRef(null),
}));
jest.mock("react-native-sortables", () => ({
  __esModule: true, default: { Grid: () => null },
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: require("react-native").View,
}));
jest.mock("@/lib/themeContext", () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => ({ user: null }) }));
jest.mock("@/hooks/useOnline", () => ({ useOnline: () => mockOnline }));
jest.mock("@/hooks/useItems", () => {
  const state = {
    items: [{ id: "note", type: "note", title: "Existing note" }],
    loading: false, error: null, saveError: null,
    create: jest.fn().mockResolvedValue(true), toggleDone: jest.fn(),
    reorder: jest.fn(), remove: jest.fn(), removeMany: jest.fn(),
  };
  return { useItems: () => state };
});
jest.mock("@/components/ui/AppIcon", () => ({ AppIcon: () => null }));
jest.mock("@/components/inbox/InboxHeader", () => ({ InboxHeader: () => null }));
jest.mock("@/components/inbox/SwipeDeleteRow", () => ({ SwipeDeleteRow: () => null }));
jest.mock("@/components/items/DeleteItemsDialog", () => ({ DeleteItemsDialog: () => null }));

import Sortable from "react-native-sortables";
import InboxScreen from "../../../app/(app)/index";
import { CaptureBar } from "@/components/inbox/CaptureBar";
import { InboxSelectionBar } from "@/components/inbox/InboxSelectionBar";

let tree: ReactTestRenderer;
function enterSelection() {
  act(() => {
    tree.root.findByType(Sortable.Grid).props.onDragEnd({
      data: [{ id: "note", type: "note", title: "Existing note" }],
      fromIndex: 0, toIndex: 0,
    });
  });
}
function openWidget() {
  act(() => {
    for (const listener of mockListeners) {
      listener({ url: "thinkdo:///?focus=capture&source=widget" });
    }
  });
}
beforeEach(() => {
  mockOnline = true;
  mockParams = {};
  act(() => { tree = create(createElement(InboxScreen)); });
});
afterEach(() => act(() => tree.unmount()));

test("reopening capture clears selection, enables input and preserves the draft on repeated widget taps", () => {
  act(() => tree.root.findByType(TextInput).props.onChangeText("Draft"));
  for (let tap = 0; tap < 2; tap++) {
    enterSelection();
    expect(tree.root.findByType(TextInput).props.editable).toBe(false);
    openWidget();
    expect(tree.root.findAllByType(InboxSelectionBar)).toHaveLength(0);
    expect(tree.root.findByType(TextInput).props.editable).toBe(true);
    expect(tree.root.findByType(TextInput).props.value).toBe("Draft");
    expect(tree.root.findByType(CaptureBar).props.focusEpoch).toBeGreaterThan(tap);
  }
});

test("route parameters also clear selection when opening widget capture", () => {
  enterSelection();
  mockParams = { focus: "capture", source: "widget" };
  act(() => tree.update(createElement(InboxScreen)));
  expect(tree.root.findAllByType(InboxSelectionBar)).toHaveLength(0);
  expect(tree.root.findByType(TextInput).props.editable).toBe(true);
});

test("widget capture keeps the input disabled when offline", () => {
  enterSelection();
  mockOnline = false;
  act(() => tree.update(createElement(InboxScreen)));
  openWidget();
  expect(tree.root.findAllByType(InboxSelectionBar)).toHaveLength(0);
  expect(tree.root.findByType(TextInput).props.editable).toBe(false);
});
