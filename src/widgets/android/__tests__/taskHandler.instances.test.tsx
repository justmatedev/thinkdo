jest.mock("react-native/Libraries/Utilities/Platform", () => {
  const platform = { OS: "android", select: (values: Record<string, unknown>) => values.android };
  return { __esModule: true, default: platform, ...platform };
});
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: { uid: "a" }, authStateReady: async () => {} },
}));
const mockUpdate = jest.fn();
jest.mock("@/services/items", () => ({ updateItem: (...args: unknown[]) => mockUpdate(...args) }));
jest.mock("@/widgets/inbox/InboxWidget", () => ({ InboxWidget: () => null }));
jest.mock("@/widgets/capture/CaptureWidget", () => ({ CaptureWidget: () => null }));
const mockPublished = new Map<number, boolean>();
jest.mock("react-native-android-widget", () => ({
  getWidgetInfo: async () => [
    { widgetId: 7, width: 320, height: 180 },
    { widgetId: 8, width: 220, height: 140 },
  ],
  requestWidgetUpdateById: async ({ widgetId, renderWidget }: {
    widgetId: number;
    renderWidget: (info: object) => Promise<{ props: { snapshot: { items: { done: boolean }[] } } }>;
  }) => {
    const result = await renderWidget({ widgetId, width: 320, height: 180 });
    mockPublished.set(widgetId, result.props.snapshot.items[0].done);
  },
}));
import AsyncStorage from "@react-native-async-storage/async-storage";
import { widgetTaskHandler } from "@/widgets/android/taskHandler";
import { beginInboxSession } from "@/widgets/snapshot/session";
import { INBOX_SNAPSHOT_KEY } from "@/widgets/snapshot";
import { saveWidgetThemePreference } from "@/widgets/capture/widgetThemePreference";

beforeEach(async () => {
  await AsyncStorage.clear();
  beginInboxSession("a");
  mockPublished.clear();
  mockPublished.set(7, false);
  mockPublished.set(8, false);
  mockUpdate.mockReset().mockResolvedValue(undefined);
  await AsyncStorage.setItem(INBOX_SNAPSHOT_KEY, JSON.stringify({
    uid: "a", signedIn: true, updatedAt: 1,
    items: [{ id: "task", type: "task", title: "Task", done: false }],
  }));
  await saveWidgetThemePreference(7, "light");
  await saveWidgetThemePreference(8, "light");
});
async function clickTask() {
  await widgetTaskHandler({
    widgetInfo: {
      widgetName: "Inbox", widgetId: 7, width: 320, height: 180,
      screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 1, densityDpi: 160 },
    },
    widgetAction: "WIDGET_CLICK", clickAction: "INBOX_TOGGLE_DONE",
    clickActionData: { itemId: "task", done: true },
    renderWidget: () => {},
  });
}
test("checking a task publishes the new state to every installed Inbox instance without React mounted", async () => {
  await clickTask();
  expect([...mockPublished.entries()]).toEqual([[7, true], [8, true]]);
});
test("a failed save leaves every widget at its previous state", async () => {
  mockUpdate.mockRejectedValueOnce(new Error("save failed"));
  await clickTask();
  expect([...mockPublished.entries()]).toEqual([[7, false], [8, false]]);
});
