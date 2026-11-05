const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

const mockGetItem = jest.fn();
jest.mock("@/services/items", () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
}));

jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: null as { uid: string } | null },
}));

import { auth } from "@/lib/firebase";
import {
  consumePendingReminderItemId,
  setPendingReminderItemId,
} from "@/features/reminders/pendingReminderNavigation";
import {
  flushPendingReminderNavigation,
  itemIdFromNotificationData,
  openReminderFromNotification,
} from "@/features/reminders/openReminderNavigation";

const mutableAuth = auth as unknown as {
  currentUser: { uid: string } | null;
};

describe("itemIdFromNotificationData", () => {
  it("reads a non-empty string itemId", () => {
    expect(itemIdFromNotificationData({ itemId: "abc" })).toBe("abc");
  });

  it("rejects missing, empty, or non-string values", () => {
    expect(itemIdFromNotificationData(undefined)).toBeNull();
    expect(itemIdFromNotificationData({})).toBeNull();
    expect(itemIdFromNotificationData({ itemId: "" })).toBeNull();
    expect(itemIdFromNotificationData({ itemId: 1 })).toBeNull();
  });
});

describe("openReminderFromNotification", () => {
  beforeEach(() => {
    consumePendingReminderItemId();
    jest.clearAllMocks();
    mutableAuth.currentUser = null;
  });

  it("stashes the item id when signed out", async () => {
    await openReminderFromNotification("abc");
    expect(consumePendingReminderItemId()).toBe("abc");
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("replaces home when the item is missing", async () => {
    mutableAuth.currentUser = { uid: "u1" };
    mockGetItem.mockResolvedValue(null);
    await openReminderFromNotification("gone");
    expect(mockGetItem).toHaveBeenCalledWith("u1", "gone");
    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("replaces home when getItem fails", async () => {
    mutableAuth.currentUser = { uid: "u1" };
    mockGetItem.mockRejectedValue(new Error("offline"));
    await openReminderFromNotification("abc");
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("pushes the editor when the item exists", async () => {
    mutableAuth.currentUser = { uid: "u1" };
    mockGetItem.mockResolvedValue({ id: "abc" });
    await openReminderFromNotification("abc");
    expect(mockPush).toHaveBeenCalledWith("/item/abc");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("flushPendingReminderNavigation", () => {
  beforeEach(() => {
    consumePendingReminderItemId();
    jest.clearAllMocks();
    mutableAuth.currentUser = { uid: "u1" };
  });

  it("is a no-op without a pending id", async () => {
    await flushPendingReminderNavigation();
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it("opens the pending item after sign-in", async () => {
    setPendingReminderItemId("abc");
    mockGetItem.mockResolvedValue({ id: "abc" });
    await flushPendingReminderNavigation();
    expect(mockPush).toHaveBeenCalledWith("/item/abc");
    expect(consumePendingReminderItemId()).toBeNull();
  });
});
