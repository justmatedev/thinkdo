import { act, deferred, renderHook } from "@/test/renderHook";
import type { Item } from "@/types/item";
const mockGet = jest.fn();
const mockUpdate = jest.fn();
let mockUid: string | undefined = "u1";
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUid ? { uid: mockUid } : null }),
}));
jest.mock("@/services/items", () => ({
  getItem: (...args: unknown[]) => mockGet(...args),
  updateItem: (...args: unknown[]) => mockUpdate(...args),
}));
jest.mock("@/services/deleteItemsWithReminders", () => ({
  deleteItemsWithReminders: jest.fn(),
}));
jest.mock("@/features/reminders/reminderScheduler", () => ({
  cancelItemReminder: jest.fn(),
  requestReminderPermissions: jest.fn().mockResolvedValue(true),
  scheduleItemReminder: jest.fn(),
}));
import { useItemEditor } from "@/hooks/useItemEditor";
import {
  beginInboxSession,
  invalidateInboxSession,
} from "@/widgets/snapshot/session";
import {
  requestReminderPermissions,
  scheduleItemReminder,
} from "@/features/reminders/reminderScheduler";
const item: Item = {
  id: "a",
  type: "note",
  title: "Title",
  body: "Original",
  done: false,
  color: null,
  reminder: null,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
async function load(id = "a") {
  const hook = renderHook(() => useItemEditor(id));
  await act(async () => {});
  return hook;
}
beforeEach(() => {
  beginInboxSession("u1");
  jest.mocked(requestReminderPermissions).mockReset().mockResolvedValue(true);
  jest.mocked(scheduleItemReminder).mockClear();
  jest.useFakeTimers();
  mockUid = "u1";
  mockGet.mockReset().mockResolvedValue(item);
  mockUpdate.mockReset().mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());
test("reports a failed read and retries without remaining in loading state", async () => {
  mockGet.mockRejectedValueOnce(new Error("denied"));
  const hook = await load();
  expect(hook.current.loadError).toBeTruthy();
  expect(hook.current.loading).toBe(false);
  await act(async () => {
    hook.current.retryLoad();
  });
  expect(hook.current.item?.id).toBe("a");
  expect(hook.current.loadError).toBeNull();
  hook.unmount();
});
test("writes only changed fields, preserving a remote body update", async () => {
  const hook = await load();
  act(() => hook.current.update({ color: "blue" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(mockUpdate).toHaveBeenCalledWith("u1", "a", { color: "blue" });
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("serializes writes and does not report saved while newer edits are pending", async () => {
  const pending = deferred<void>();
  mockUpdate.mockReturnValueOnce(pending.promise);
  const hook = await load();
  act(() => hook.current.update({ body: "First" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  act(() => hook.current.update({ title: "New" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(hook.current.status).toBe("saving");
  await act(async () => pending.resolve());
  expect(mockUpdate).toHaveBeenNthCalledWith(2, "u1", "a", { title: "New" });
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("retains failed changes for explicit retry with the latest edits", async () => {
  mockUpdate.mockRejectedValueOnce(new Error("offline"));
  const hook = await load();
  act(() => hook.current.update({ body: "Keep me" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(hook.current.status).toBe("error");
  await act(async () => hook.current.retrySave());
  expect(mockUpdate).toHaveBeenLastCalledWith("u1", "a", { body: "Keep me" });
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("ignores a read that finishes after switching items", async () => {
  const old = deferred<Item>();
  mockGet.mockReturnValueOnce(old.promise);
  let id = "old";
  const hook = renderHook(() => useItemEditor(id));
  id = "a";
  hook.rerender();
  await act(async () => {});
  await act(async () => old.resolve({ ...item, id: "old" }));
  expect(hook.current.item?.id).toBe("a");
  hook.unmount();
});
test("conversion writes type and done without stale body/title", async () => {
  const hook = await load();
  act(() => hook.current.convert());
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(mockUpdate).toHaveBeenCalledWith("u1", "a", {
    type: "task",
    done: false,
  });
  hook.unmount();
});

test("does not schedule after logout when a permission request finishes late", async () => {
  const permission = deferred<boolean>();
  jest
    .mocked(requestReminderPermissions)
    .mockReturnValueOnce(permission.promise);
  mockGet.mockResolvedValue({
    ...item,
    reminder: { kind: "daily", hour: 9, minute: 0 },
  });
  const hook = await load();
  act(() => hook.current.update({ title: "Private" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  invalidateInboxSession();
  await act(async () => permission.resolve(true));
  expect(scheduleItemReminder).not.toHaveBeenCalled();
  hook.unmount();
});

test("retains newer values when an in-flight save fails and retries the merged patch", async () => {
  const pending = deferred<void>();
  mockUpdate.mockReturnValueOnce(pending.promise);
  const hook = await load();
  act(() => hook.current.update({ body: "First", title: "Changed" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  act(() => hook.current.update({ body: "Latest" }));
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  await act(async () => pending.reject(new Error("offline")));
  expect(hook.current.status).toBe("error");
  await act(async () => hook.current.retrySave());
  expect(mockUpdate).toHaveBeenLastCalledWith("u1", "a", {
    body: "Latest",
    title: "Changed",
  });
  hook.unmount();
});
test("flushes pending edits when navigating away before the debounce", async () => {
  const hook = await load();
  act(() => hook.current.update({ body: "Do not lose" }));
  hook.unmount();
  await act(async () => {});
  expect(mockUpdate).toHaveBeenCalledWith("u1", "a", { body: "Do not lose" });
});
