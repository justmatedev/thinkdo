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
} from "@/features/reminders/reminderScheduler";
import type { Item } from "@/types/item";

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

it('waits for an in-flight notification schedule before clearing on logout', async () => {
  const { cancelAllReminders } = require('@/features/reminders/reminderScheduler');
  jest.clearAllMocks();
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockCancel.mockResolvedValue(undefined); mockSetChannel.mockResolvedValue(undefined);
  let finish!: () => void;
  let markStarted!: () => void;
  const started = new Promise<void>((resolve) => { markStarted = resolve; });
  const scheduled: { identifier: string }[] = [];
  mockSchedule.mockImplementationOnce(async () => {
    markStarted();
    await new Promise<void>((resolve) => { finish = resolve; });
    scheduled.push({ identifier: 'reminder:a' });
  });
  mockGetAll.mockImplementation(async () => [...scheduled]);
  mockCancel.mockImplementation(async (id: string) => {
    const index = scheduled.findIndex((entry) => entry.identifier === id);
    if (index >= 0) scheduled.splice(index, 1);
  });
  const saving = scheduleItemReminder(item({ id: 'a', reminder: { kind: 'daily', hour: 9, minute: 0 } }));
  await started;
  const logout = cancelAllReminders();
  await Promise.resolve();
  finish();
  await Promise.all([saving, logout]);
  expect(scheduled).toEqual([]);
});

describe('completed tasks and scheduling races', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockCancel.mockResolvedValue(undefined);
    mockSchedule.mockResolvedValue(undefined);
    mockSetChannel.mockResolvedValue(undefined);
    mockGetAll.mockResolvedValue([]);
  });
  for (const reminder of [
    { kind: 'once' as const, at: new Date('2099-01-01') },
    { kind: 'daily' as const, hour: 9, minute: 0 },
    { kind: 'weekly' as const, weekdays: [2 as const, 4 as const], hour: 9, minute: 0 },
  ]) {
    it(`pauses and resumes a completed task with ${reminder.kind} reminder`, async () => {
      await scheduleItemReminder(item({ id: 'completed', type: 'task', done: true, reminder }));
      expect(mockSchedule).not.toHaveBeenCalled();
      expect(mockCancel).toHaveBeenCalledWith('reminder:completed');
      await scheduleItemReminder(item({ id: 'completed', type: 'task', done: false, reminder }));
      expect(mockSchedule).toHaveBeenCalled();
    });
  }
  it('does not resume a past once reminder and ignores done on notes', async () => {
    await scheduleItemReminder(item({ id: 'past', type: 'task', done: false, reminder: { kind: 'once', at: new Date(0) } }));
    expect(mockSchedule).not.toHaveBeenCalled();
    await scheduleItemReminder(item({ id: 'note', done: true, reminder: { kind: 'daily', hour: 9, minute: 0 } }));
    expect(mockSchedule).toHaveBeenCalled();
  });
  it('a completion or deletion cancels an older schedule finishing late', async () => {
    let finish!: () => void;
    let started!: () => void;
    const beginning = new Promise<void>(resolve => { started = resolve; });
    const scheduled = new Set<string>();
    mockCancel.mockImplementation(async (id: string) => { scheduled.delete(id); });
    mockSchedule.mockImplementationOnce(async ({ identifier }: { identifier: string }) => {
      started(); await new Promise<void>(resolve => { finish = resolve; }); scheduled.add(identifier);
    });
    const old = scheduleItemReminder(item({ id: 'race', reminder: { kind: 'daily', hour: 9, minute: 0 } }));
    await beginning;
    const cancellation = cancelItemReminder('race');
    finish();
    await Promise.all([old, cancellation]);
    expect(scheduled.size).toBe(0);
  });
  it('the newest edit wins while an earlier schedule is waiting for permission', async () => {
    let resolve!: (value: { status: string }) => void;
    mockGetPermissions.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const old = scheduleItemReminder(item({ id: 'newest', title: 'Old', reminder: { kind: 'daily', hour: 9, minute: 0 } }));
    // Let the old operation reach the permission boundary.
    for (let n = 0; n < 5; n++) await Promise.resolve();
    const latest = scheduleItemReminder(item({ id: 'newest', title: 'New', reminder: { kind: 'daily', hour: 10, minute: 0 } }));
    resolve({ status: 'granted' });
    await Promise.all([old, latest]);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ hour: 10 }) }));
  });
});

it('does not let an older reconciliation resume a task after a newer snapshot completed it', async () => {
  jest.clearAllMocks();
  let release!: (value: { status: string }) => void;
  let started!: () => void;
  const beginning = new Promise<void>(resolve => { started = resolve; });
  mockGetPermissions.mockImplementationOnce(() => { started(); return new Promise(resolve => { release = resolve; }); });
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockCancel.mockResolvedValue(undefined);
  mockSchedule.mockResolvedValue(undefined);
  mockGetAll.mockResolvedValue([]);
  const reminder = { kind: 'daily' as const, hour: 9, minute: 0 };
  const old = reconcileReminders([item({ id: 'blocking', reminder }), item({ id: 'target', type: 'task', done: false, reminder })]);
  await beginning;
  await reconcileReminders([item({ id: 'target', type: 'task', done: true, reminder })]);
  release({ status: 'granted' });
  await old;
  expect(mockSchedule).not.toHaveBeenCalledWith(expect.objectContaining({ identifier: 'reminder:target' }));
});

it('does not resurrect a deleted item from a reconciliation waiting on another item', async () => {
  jest.clearAllMocks();
  let release!: (value: { status: string }) => void;
  let started!: () => void;
  const beginning = new Promise<void>(resolve => { started = resolve; });
  mockGetPermissions.mockImplementationOnce(() => { started(); return new Promise(resolve => { release = resolve; }); });
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  const scheduled = new Set<string>();
  mockSchedule.mockImplementation(async ({ identifier }: { identifier: string }) => { scheduled.add(identifier); });
  mockCancel.mockImplementation(async (id: string) => { scheduled.delete(id); });
  mockGetAll.mockResolvedValue([]);
  const reminder = { kind: 'daily' as const, hour: 9, minute: 0 };
  const reconciliation = reconcileReminders([item({ id: 'blocking-delete', reminder }), item({ id: 'deleted-target', reminder })]);
  await beginning;
  await cancelItemReminder('deleted-target');
  release({ status: 'granted' });
  await reconciliation;
  expect(scheduled.has('reminder:deleted-target')).toBe(false);
});
it('orphan cleanup cannot cancel an item scheduled after the reconciliation began', async () => {
  jest.clearAllMocks();
  let snapshot!: (value: { identifier: string }[]) => void;
  mockGetAll.mockImplementationOnce(() => new Promise(resolve => { snapshot = resolve; }));
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  const scheduled = new Set<string>();
  mockSchedule.mockImplementation(async ({ identifier }: { identifier: string }) => { scheduled.add(identifier); });
  mockCancel.mockImplementation(async (id: string) => { scheduled.delete(id); });
  const reconciliation = reconcileReminders([]);
  await scheduleItemReminder(item({ id: 'newly-scheduled', reminder: { kind: 'daily', hour: 9, minute: 0 } }));
  snapshot([{ identifier: 'reminder:newly-scheduled' }]);
  await reconciliation;
  expect(scheduled.has('reminder:newly-scheduled')).toBe(true);
});
