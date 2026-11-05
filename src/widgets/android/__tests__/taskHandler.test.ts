import type { WidgetTaskHandlerProps } from "react-native-android-widget";

const mockResolveInboxWidgetRepresentation = jest.fn();
const mockResolveCaptureWidgetRepresentation = jest.fn();
const mockClearInboxWidgetInstancePrefs = jest.fn();
const mockClearWidgetThemePreference = jest.fn();
const mockUpdateItem = jest.fn();
const mockAuthenticatedSnapshot = jest.fn();
jest.mock("@/widgets/snapshot/authenticatedSnapshot", () => ({ readAuthenticatedInboxSnapshot: () => mockAuthenticatedSnapshot() }));
const mockPatchInboxSnapshotItemDone = jest.fn();

jest.mock("@/widgets/inbox/inboxWidgetRender", () => ({
  resolveInboxWidgetRepresentation: (...args: unknown[]) =>
    mockResolveInboxWidgetRepresentation(...args),
}));
jest.mock("@/widgets/capture/captureWidgetRender", () => ({
  resolveCaptureWidgetRepresentation: (...args: unknown[]) =>
    mockResolveCaptureWidgetRepresentation(...args),
}));
jest.mock("@/widgets/inbox/inboxWidgetFilter", () => ({
  clearInboxWidgetInstancePrefs: (...args: unknown[]) =>
    mockClearInboxWidgetInstancePrefs(...args),
}));
jest.mock("@/widgets/capture/widgetThemePreference", () => ({
  clearWidgetThemePreference: (...args: unknown[]) =>
    mockClearWidgetThemePreference(...args),
}));
jest.mock("@/services/items", () => ({
  updateItem: (...args: unknown[]) => mockUpdateItem(...args),
}));
jest.mock("@/widgets/snapshot", () => ({
  patchInboxSnapshotItemDone: (...args: unknown[]) =>
    mockPatchInboxSnapshotItemDone(...args),
}));
jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: { uid: "user-1" } },
}));

import { widgetTaskHandler } from "@/widgets/android/taskHandler";
import { CLICK_TOGGLE_DONE } from "@/widgets/inbox/inboxWidgetActions";
import { auth } from "@/lib/firebase";

const mutableAuth = auth as unknown as {
  currentUser: { uid: string } | null;
};

function inboxProps(
  overrides: Partial<WidgetTaskHandlerProps> = {}
): WidgetTaskHandlerProps {
  return {
    widgetInfo: {
      widgetId: 7,
      widgetName: "Inbox",
      width: 320,
      height: 180,
      screenInfo: {
        screenHeightDp: 800,
        screenWidthDp: 400,
        density: 1,
        densityDpi: 160,
      },
    },
    widgetAction: "WIDGET_UPDATE",
    renderWidget: jest.fn(),
    ...overrides,
  };
}

describe("widgetTaskHandler Inbox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableAuth.currentUser = { uid: "user-1" };
    mockUpdateItem.mockReset().mockResolvedValue(undefined);
    mockAuthenticatedSnapshot.mockResolvedValue({ uid: "user-1", signedIn: true, items: [{ id: "item-1" }] });
    mockResolveInboxWidgetRepresentation.mockResolvedValue({ kind: "inbox" });
  });

  it("renders Inbox for update lifecycle actions", async () => {
    const props = inboxProps();

    await widgetTaskHandler(props);

    expect(mockResolveInboxWidgetRepresentation).toHaveBeenCalledWith(
      7,
      320,
      180
    );
    expect(props.renderWidget).toHaveBeenCalledWith({ kind: "inbox" });
  });

  it("keeps the widget when inbox render resolution fails", async () => {
    mockResolveInboxWidgetRepresentation.mockRejectedValue(
      new Error("snapshot failed")
    );
    const props = inboxProps();

    await expect(widgetTaskHandler(props)).resolves.toBeUndefined();
    expect(props.renderWidget).not.toHaveBeenCalled();
  });

  it("clears instance preferences when Inbox is deleted", async () => {
    await widgetTaskHandler(inboxProps({ widgetAction: "WIDGET_DELETED" }));

    expect(mockClearInboxWidgetInstancePrefs).toHaveBeenCalledWith(7);
  });

  it("persists a done toggle, patches the snapshot, and rerenders", async () => {
    const props = inboxProps({
      widgetAction: "WIDGET_CLICK",
      clickAction: CLICK_TOGGLE_DONE,
      clickActionData: { itemId: "item-1", done: true },
    });

    await widgetTaskHandler(props);

    expect(mockUpdateItem).toHaveBeenCalledWith("user-1", "item-1", {
      done: true,
    });
    expect(mockPatchInboxSnapshotItemDone).toHaveBeenCalledWith("item-1", true, expect.objectContaining({ uid: "user-1" }));
    expect(props.renderWidget).toHaveBeenCalledWith({ kind: "inbox" });
  });

  it("leaves the snapshot unchanged when the Firestore update fails", async () => {
    mockUpdateItem.mockRejectedValue(new Error("offline"));
    const props = inboxProps({
      widgetAction: "WIDGET_CLICK",
      clickAction: CLICK_TOGGLE_DONE,
      clickActionData: { itemId: "item-1", done: true },
    });

    await widgetTaskHandler(props);

    expect(mockPatchInboxSnapshotItemDone).not.toHaveBeenCalled();
    expect(props.renderWidget).toHaveBeenCalledWith({ kind: "inbox" });
  });

  it("does not mutate data for an unauthenticated toggle", async () => {
    mutableAuth.currentUser = null;
    const props = inboxProps({
      widgetAction: "WIDGET_CLICK",
      clickAction: CLICK_TOGGLE_DONE,
      clickActionData: { itemId: "item-1", done: true },
    });

    await widgetTaskHandler(props);

    expect(mockUpdateItem).not.toHaveBeenCalled();
    expect(mockPatchInboxSnapshotItemDone).not.toHaveBeenCalled();
    expect(props.renderWidget).toHaveBeenCalledWith({ kind: "inbox" });
  });
});

test("rejects a widget action when the snapshot belongs to another account", async () => {
  mockUpdateItem.mockClear();
  mockAuthenticatedSnapshot.mockResolvedValue({ uid: "other", signedIn: true, items: [{ id: "item-1" }] });
  await widgetTaskHandler(inboxProps({ widgetAction: "WIDGET_CLICK", clickAction: CLICK_TOGGLE_DONE, clickActionData: { itemId: "item-1", done: true } }));
  expect(mockUpdateItem).not.toHaveBeenCalled();
});
