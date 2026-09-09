jest.mock("react-native/Libraries/Utilities/Platform", () => {
  const platform = {
    OS: "android",
    select: (options: Record<string, unknown>) => options.android,
  };
  return { __esModule: true, default: platform, ...platform };
});

const mockCancel = jest.fn();
const mockSchedule = jest.fn();
const mockGetAll = jest.fn();
const mockGetPermissions = jest.fn();
const mockSetChannel = jest.fn();

jest.mock("expo-notifications", () => ({
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: {
    DATE: "date",
    DAILY: "daily",
    WEEKLY: "weekly",
  },
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancel(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    mockGetAll(...args),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissions(...args),
  setNotificationChannelAsync: (...args: unknown[]) =>
    mockSetChannel(...args),
  setNotificationHandler: jest.fn(),
}));

import {
  cancelItemReminder,
  reconcileReminders,
  scheduleItemReminder,
} from "../reminderScheduler";
import type { Item } from "../../types/item";

function item(partial: Partial<Item> & Pick<Item, "id">): Item {
  return {
    type: "note",
    title: "Lembrete",
    body: "",
    done: false,
    color: null,
    reminder: null,
    sortOrder: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...partial,
  };
}

describe("scheduleItemReminder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ status: "granted" });
    mockCancel.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue(undefined);
    mockSetChannel.mockResolvedValue(undefined);
    mockGetAll.mockResolvedValue([]);
  });

  it("cancels when the item has no reminder", async () => {
    await scheduleItemReminder(item({ id: "a" }));
    expect(mockCancel).toHaveBeenCalledWith("reminder:a");
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("cancels a past once reminder instead of scheduling", async () => {
    await scheduleItemReminder(
      item({
        id: "a",
        reminder: { kind: "once", at: new Date("2020-01-01") },
      })
    );
    expect(mockCancel).toHaveBeenCalledWith("reminder:a");
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("cancels when notification permission is denied", async () => {
    mockGetPermissions.mockResolvedValue({ status: "denied" });
    await scheduleItemReminder(
      item({
        id: "a",
        reminder: { kind: "daily", hour: 9, minute: 0 },
      })
    );
    expect(mockCancel).toHaveBeenCalledWith("reminder:a");
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("schedules one weekly notification per selected weekday", async () => {
    await scheduleItemReminder(
      item({
        id: "a",
        reminder: { kind: "weekly", weekdays: [2, 4], hour: 9, minute: 0 },
      })
    );
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "reminder:a:w2" })
    );
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "reminder:a:w4" })
    );
    expect(mockSchedule).toHaveBeenCalledTimes(2);
  });
});

describe("reconcileReminders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ status: "granted" });
    mockCancel.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue(undefined);
    mockSetChannel.mockResolvedValue(undefined);
    mockGetAll.mockResolvedValue([]);
  });

  it("cancels orphan reminder ids and leaves unrelated notifications", async () => {
    mockGetAll.mockResolvedValue([
      { identifier: "reminder:gone" },
      { identifier: "reminder:gone:w2" },
      { identifier: "reminder:live" },
      { identifier: "other:x" },
    ]);

    await reconcileReminders([
      item({
        id: "live",
        reminder: { kind: "daily", hour: 8, minute: 0 },
      }),
    ]);

    expect(mockCancel).toHaveBeenCalledWith("reminder:gone");
    expect(mockCancel).toHaveBeenCalledWith("reminder:gone:w2");
    expect(mockCancel).not.toHaveBeenCalledWith("other:x");
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "reminder:live" })
    );
  });
});

describe("cancelItemReminder", () => {
  it("ignores cancel errors", async () => {
    mockCancel.mockRejectedValueOnce(new Error("missing"));
    await expect(cancelItemReminder("a")).resolves.toBeUndefined();
  });
});
