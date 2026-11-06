import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { readEditorDraft, writeEditorDraft } from "@/features/editor/editorDrafts";
import { deleteItemsWithReminders } from "@/services/deleteItemsWithReminders";
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
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
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
  jest.mocked(deleteItemsWithReminders).mockReset().mockResolvedValue({ deleted: ["a"], failed: [] });
  beginInboxSession("u1");
  jest.mocked(requestReminderPermissions).mockReset().mockResolvedValue(true);
  jest.mocked(scheduleItemReminder).mockClear();
  jest.useFakeTimers();
  mockUid = "u1";
  mockGet.mockReset().mockResolvedValue(item);
  mockUpdate.mockReset().mockResolvedValue(undefined);
});
afterEach(() => jest.useRealTimers());
test.each(['note', 'task'] as const)('undoes and redoes text with durable autosave for a %s', async type => {
  mockGet.mockResolvedValue({ ...item, type });
  const hook = await load();
  expect(hook.current.canUndo).toBe(false);
  act(() => { hook.current.update({ title: 'Changed' }); hook.current.update({ body: 'New body' }); });
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Original');
  expect(hook.current.item?.title).toBe('Changed');
  await act(async () => {});
  expect((await readEditorDraft('u1', 'a'))?.patch).toEqual({ title: 'Changed', body: 'Original' });
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).toHaveBeenLastCalledWith('u1', 'a', { title: 'Changed', body: 'Original' });
  act(() => hook.current.redoText());
  expect(hook.current.item?.body).toBe('New body');
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).toHaveBeenLastCalledWith('u1', 'a', { body: 'New body' });
  act(() => { hook.current.undoText(); hook.current.undoText(); });
  expect(hook.current.item?.title).toBe('Title');
  expect(hook.current.canUndo).toBe(false);
  hook.unmount();
});

test('undo preserves metadata and metadata edits preserve redo but close typing groups', async () => {
  const hook = await load();
  act(() => hook.current.update({ body: 'Originala' }));
  act(() => hook.current.update({ color: 'blue', done: true }));
  act(() => hook.current.update({ body: 'Originalab' }));
  act(() => hook.current.undoText());
  expect(hook.current.item).toMatchObject({ body: 'Originala', color: 'blue', done: true });
  await act(async () => { jest.advanceTimersByTime(500); });
  mockUpdate.mockClear();
  act(() => hook.current.undoText());
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).toHaveBeenCalledWith('u1', 'a', { body: 'Original' });
  act(() => hook.current.update({ reminder: { kind: 'daily', hour: 9, minute: 0 } }));
  expect(hook.current.canRedo).toBe(true);
  act(() => hook.current.redoText());
  expect(hook.current.item?.body).toBe('Originala');
  act(() => hook.current.update({ body: 'Branch' }));
  expect(hook.current.canRedo).toBe(false);
  hook.unmount();
});

test.each([false, true])('a late save cannot overwrite undo (rejected=%s)', async rejected => {
  const write = deferred<void>(); mockUpdate.mockReturnValueOnce(write.promise);
  const hook = await load();
  act(() => hook.current.update({ body: 'First' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => hook.current.undoText());
  await act(async () => { jest.advanceTimersByTime(500); });
  await act(async () => rejected ? write.reject(new Error('offline')) : write.resolve());
  expect(hook.current.item?.body).toBe('Original');
  expect(hook.current.canRedo).toBe(true);
  await act(async () => hook.current.retrySave());
  expect(mockUpdate).toHaveBeenLastCalledWith('u1', 'a', { body: 'Original' });
  expect(hook.current.status).toBe('saved');
  hook.unmount();
});

test('local persistence failure keeps undo usable and validation follows restored text', async () => {
  const hook = await load();
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
  act(() => hook.current.update({ body: 'x'.repeat(100001) }));
  await act(async () => {});
  expect(hook.current.fieldErrors.body).toBeTruthy();
  expect(hook.current.localPersistence).toBe('error');
  act(() => hook.current.undoText());
  expect(hook.current.fieldErrors.body).toBeUndefined();
  expect(hook.current.item?.body).toBe('Original');
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).toHaveBeenLastCalledWith('u1', 'a', { body: 'Original' });
  hook.unmount();
});

test.each(['recover', 'discard'])('%s draft establishes an empty history', async choice => {
  await writeEditorDraft({ version: 1, uid: 'u1', itemId: 'a', revision: 'stored',
    patch: { body: 'Local' }, original: { body: 'Original' } });
  const hook = await load();
  act(() => { hook.current.undoText(); hook.current.redoText(); hook.current.update({ body: 'Blocked' }); });
  expect(hook.current.item?.body).toBe('Original');
  await act(async () => choice === 'recover' ? hook.current.recoverDraft() : hook.current.discardDraft());
  expect(hook.current.item?.body).toBe(choice === 'recover' ? 'Local' : 'Original');
  expect(hook.current.canUndo).toBe(false);
  expect(hook.current.canRedo).toBe(false);
  act(() => hook.current.update({ body: 'Next' }));
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe(choice === 'recover' ? 'Local' : 'Original');
  hook.unmount();
});

test('text history cannot leak across items, accounts, remounts or stale callbacks', async () => {
  let id = 'a';
  const hook = renderHook(() => useItemEditor(id));
  await act(async () => {});
  act(() => hook.current.update({ body: 'Private' }));
  const staleUndo = hook.current.undoText;
  id = 'b'; hook.rerender();
  await act(async () => {});
  expect(hook.current.canUndo).toBe(false);
  act(() => hook.current.update({ body: 'Other' }));
  beginInboxSession('u2'); mockUid = 'u2'; hook.rerender();
  await act(async () => {});
  expect(hook.current.canUndo).toBe(false);
  act(() => staleUndo());
  expect(hook.current.item?.body).toBe('Original');
  hook.unmount();
  await act(async () => {});
  const reopened = await load('b');
  expect(reopened.current.canUndo).toBe(false);
  reopened.unmount();
});

test('undo and redo are blocked once deletion or session invalidation starts', async () => {
  const hook = await load();
  act(() => hook.current.update({ body: 'Keep' }));
  let removal!: Promise<void>;
  act(() => { removal = hook.current.remove(); hook.current.undoText(); });
  expect(hook.current.item?.body).toBe('Keep');
  await act(async () => removal);
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Keep');
  hook.unmount();
  const other = await load();
  act(() => other.current.update({ body: 'Private' }));
  invalidateInboxSession();
  act(() => other.current.undoText());
  expect(other.current.item?.body).toBe('Private');
  other.unmount();
});

test('automatic blank-title restoration preserves body history without blank-title cycles', async () => {
  const hook = await load();
  act(() => hook.current.update({ title: '' }));
  act(() => hook.current.undoText());
  expect(hook.current.item?.title).toBe('Title');
  act(() => hook.current.redoText());
  expect(hook.current.fieldErrors.title).toBeTruthy();
  act(() => hook.current.update({ body: 'Body edit' }));
  act(() => hook.current.finishTitleEditing());
  expect(hook.current.item?.title).toBe('Title');
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Original');
  expect(hook.current.canUndo).toBe(false);
  act(() => hook.current.redoText());
  expect(hook.current.item?.title).toBe('Title');
  hook.unmount();
});

test('actual title normalization drops incompatible title history, ordinary save preserves it', async () => {
  const hook = await load();
  act(() => hook.current.update({ title: 'New' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.canUndo).toBe(true);
  act(() => { hook.current.update({ body: 'Changed' }); hook.current.update({ title: '  Spaced  ' }); });
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.item?.title).toBe('Spaced');
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Original');
  expect(hook.current.item?.title).toBe('Spaced');
  expect(hook.current.canUndo).toBe(false);
  hook.unmount();
});

test('background and explicit boundary close groups without clearing history', async () => {
  let listener: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => { listener = fn; return { remove: jest.fn() }; });
  const hook = await load();
  act(() => hook.current.update({ body: 'Originala' }));
  await act(async () => listener('background'));
  act(() => hook.current.update({ body: 'Originalab' }));
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Originala');
  act(() => { hook.current.redoText(); hook.current.finishTextGroup(); hook.current.update({ body: 'Originalabc' }); });
  act(() => hook.current.undoText());
  expect(hook.current.item?.body).toBe('Originalab');
  hook.unmount();
});

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
  expect(hook.current.status).toBe("draft");
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
  expect(hook.current.status).toBe("draft");
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

test("recovers a failed save after unmount without uploading before a choice", async () => {
  mockUpdate.mockRejectedValue(new Error("offline"));
  const first = await load();
  act(() => first.current.update({ body: "Recovered" }));
  first.unmount();
  await act(async () => {});
  expect((await readEditorDraft("u1", "a"))?.patch.body).toBe("Recovered");
  mockUpdate.mockClear().mockResolvedValue(undefined);
  const second = await load();
  expect(second.current.recoveryDraft?.patch.body).toBe("Recovered");
  expect(mockUpdate).not.toHaveBeenCalled();
  act(() => second.current.recoverDraft());
  expect(second.current.item?.body).toBe("Recovered");
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(await readEditorDraft("u1", "a")).toBeNull();
  second.unmount();
});
test("reports conflicting fields and discards only the draft", async () => {
  await writeEditorDraft({ version: 1, uid: "u1", itemId: "a", revision: "stored", patch: { body: "Local" }, original: { body: "Old" } });
  const hook = await load();
  expect(hook.current.recoveryConflicts).toEqual(["body"]);
  await act(async () => hook.current.discardDraft());
  expect(hook.current.item?.body).toBe("Original");
  expect(mockUpdate).not.toHaveBeenCalled();
  hook.unmount();
});
test("keeps deleted item text available without recreating the item", async () => {
  await writeEditorDraft({ version: 1, uid: "u1", itemId: "a", revision: "stored", patch: { body: "Deleted text" }, original: { body: "Original" } });
  mockGet.mockResolvedValue(null);
  const hook = await load();
  expect(hook.current.missing).toBe(true);
  expect(hook.current.notFound).toBe(false);
  expect(hook.current.recoveryDraft?.patch.body).toBe("Deleted text");
  act(() => hook.current.recoverDraft());
  expect(mockUpdate).not.toHaveBeenCalled();
  hook.unmount();
});
test("does not upload after an account switch, retaining the old account draft", async () => {
  const hook = await load();
  act(() => hook.current.update({ body: "Private" }));
  beginInboxSession("u2"); mockUid = "u2";
  hook.rerender();
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).not.toHaveBeenCalled();
  expect((await readEditorDraft("u1", "a"))?.patch.body).toBe("Private");
  expect(hook.current.recoveryDraft).toBeNull();
  hook.unmount();
});
test("never uploads when local draft persistence fails and supports retry", async () => {
  const hook = await load();
  jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("full"));
  act(() => hook.current.update({ body: "Unsaved" }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.localPersistence).toBe("error");
  expect(mockUpdate).not.toHaveBeenCalled();
  await act(async () => hook.current.retrySave());
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("retains newer draft revisions while an older write is acknowledged", async () => {
  const write = deferred<void>(); mockUpdate.mockReturnValueOnce(write.promise);
  const hook = await load();
  act(() => hook.current.update({ body: "First" }));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => hook.current.update({ body: "Latest" }));
  await act(async () => write.resolve());
  expect((await readEditorDraft("u1", "a"))?.patch.body).toBe("Latest");
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(await readEditorDraft("u1", "a")).toBeNull();
  hook.unmount();
});
test("restores an empty title on blur and reflects normalized saved titles", async () => {
  const hook = await load();
  act(() => hook.current.update({ title: "   " }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(hook.current.fieldErrors.title).toBeTruthy();
  act(() => hook.current.finishTitleEditing());
  expect(hook.current.item?.title).toBe("Title");
  expect(hook.current.titleHint).toBeTruthy();
  act(() => hook.current.update({ title: "  New  " }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.item?.title).toBe("New");
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("keeps over-limit text as a draft and resumes after correction", async () => {
  const hook = await load();
  act(() => hook.current.update({ body: "x".repeat(100001) }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.fieldErrors.body).toBeTruthy();
  expect(mockUpdate).not.toHaveBeenCalled();
  expect((await readEditorDraft("u1", "a"))?.patch.body?.length).toBe(100001);
  act(() => hook.current.update({ body: "Allowed" }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.status).toBe("saved");
  hook.unmount();
});
test("flushes on background and restores a blank title on departure", async () => {
  let listener: (state: AppStateStatus) => void = () => {};
  const spy = jest.spyOn(AppState, "addEventListener").mockImplementation((_type, fn) => { listener = fn; return { remove: jest.fn() }; });
  const hook = await load();
  act(() => hook.current.update({ title: "", body: "Background" }));
  await act(async () => listener("background"));
  expect(mockUpdate).toHaveBeenCalledWith("u1", "a", { title: "Title", body: "Background" });
  hook.unmount(); spy.mockRestore();
});
for (const rejected of [false, true]) test(`deletion waits for an in-flight save (rejected=${rejected})`, async () => {
  const write = deferred<void>(); mockUpdate.mockReturnValueOnce(write.promise);
  const hook = await load();
  act(() => hook.current.update({ body: "First" }));
  await act(async () => { jest.advanceTimersByTime(500); });
  let deletion!: Promise<void>;
  act(() => { deletion = hook.current.remove(); });
  expect(hook.current.deleting).toBe(true);
  act(() => hook.current.update({ body: "Blocked" }));
  expect(hook.current.item?.body).toBe("First");
  expect(deleteItemsWithReminders).not.toHaveBeenCalled();
  await act(async () => { if (rejected) write.reject(new Error("offline")); else write.resolve(); await deletion; });
  expect(deleteItemsWithReminders).toHaveBeenCalledTimes(1);
  expect(await readEditorDraft("u1", "a")).toBeNull();
  hook.unmount();
  await act(async () => { jest.runOnlyPendingTimers(); });
  expect(mockUpdate).toHaveBeenCalledTimes(1);
});
test("keeps the draft and shows an error after failed deletion, then retries", async () => {
  jest.mocked(deleteItemsWithReminders).mockResolvedValueOnce({ deleted: [], failed: ["a"] });
  const hook = await load();
  act(() => hook.current.update({ body: "Keep" }));
  await act(async () => { await expect(hook.current.remove()).rejects.toThrow(); });
  expect(hook.current.deleteError).toBeTruthy();
  expect(hook.current.deleting).toBe(false);
  expect((await readEditorDraft("u1", "a"))?.patch.body).toBe("Keep");
  await act(async () => hook.current.remove());
  expect(await readEditorDraft("u1", "a")).toBeNull();
  hook.unmount();
});

test('waits for the newest local revision before uploading edits made during persistence', async () => {
  const firstLocal = deferred<void>(); const secondLocal = deferred<void>();
  const actualSet = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  const hook = await load();
  const spy = jest.spyOn(AsyncStorage, 'setItem');
  spy.mockImplementationOnce(async (key, value) => { await firstLocal.promise; await actualSet(key, value); });
  spy.mockImplementationOnce(async (key, value) => { await secondLocal.promise; await actualSet(key, value); });
  act(() => hook.current.update({ body: 'First' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => hook.current.update({ body: 'Second' }));
  await act(async () => firstLocal.resolve());
  const prematureUploads = mockUpdate.mock.calls.length;
  await act(async () => secondLocal.resolve());
  hook.unmount(); spy.mockImplementation(actualSet);
  expect(prematureUploads).toBe(0);
  expect(mockUpdate).toHaveBeenCalledWith('u1', 'a', { body: 'Second' });
});
test('can retry stale draft cleanup after a successful remote write', async () => {
  const hook = await load();
  jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('storage unavailable'));
  act(() => hook.current.update({ body: 'Saved remotely' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.localPersistence).toBe('error');
  await act(async () => hook.current.retrySave());
  expect(await readEditorDraft('u1', 'a')).toBeNull();
  expect(hook.current.localPersistence).toBe('idle');
  hook.unmount();
});

test('a delayed permission response cannot resume a task completed by a newer save', async () => {
  const permission = deferred<boolean>();
  mockGet.mockResolvedValue({ ...item, type: 'task', reminder: { kind: 'daily', hour: 9, minute: 0 } });
  jest.mocked(requestReminderPermissions).mockReturnValueOnce(permission.promise);
  const hook = await load();
  act(() => hook.current.update({ title: 'New title' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => hook.current.update({ done: true }));
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(scheduleItemReminder).toHaveBeenLastCalledWith(expect.objectContaining({ done: true }), expect.any(Function));
  await act(async () => permission.resolve(true));
  expect(scheduleItemReminder).toHaveBeenLastCalledWith(expect.objectContaining({ done: true }), expect.any(Function));
  hook.unmount();
});

test('drains departure saves before a remounted editor reads its recovery draft', async () => {
  const firstWrite = deferred<void>(); const secondWrite = deferred<void>();
  mockUpdate.mockReturnValueOnce(firstWrite.promise).mockReturnValueOnce(secondWrite.promise);
  const first = await load();
  act(() => first.current.update({ body: 'First' }));
  await act(async () => { jest.advanceTimersByTime(500); });
  act(() => first.current.update({ body: 'Second' }));
  first.unmount();
  const second = renderHook(() => useItemEditor('a'));
  await act(async () => firstWrite.resolve());
  expect(mockUpdate).toHaveBeenNthCalledWith(2, 'u1', 'a', { body: 'Second' });
  const prematurelyLoaded = !second.current.loading;
  mockGet.mockResolvedValue({ ...item, body: 'Second' });
  await act(async () => secondWrite.resolve());
  expect(prematurelyLoaded).toBe(false);
  expect(second.current.recoveryDraft).toBeNull();
  expect(second.current.item?.body).toBe('Second');
  second.unmount();
});

test('keeps nonblank draft title spacing until the server confirms normalization', async () => {
  const write = deferred<void>(); mockUpdate.mockReturnValueOnce(write.promise);
  const hook = await load();
  act(() => { hook.current.update({ title: '  New  ' }); hook.current.finishTitleEditing(); });
  expect(hook.current.item?.title).toBe('  New  ');
  await act(async () => { jest.advanceTimersByTime(500); });
  expect(hook.current.item?.title).toBe('  New  ');
  await act(async () => write.resolve());
  expect(hook.current.item?.title).toBe('New');
  hook.unmount();
});
test('preserves a draft across logout and only offers it after the same account logs in', async () => {
  const hook = await load();
  act(() => hook.current.update({ body: 'After login' }));
  beginInboxSession(null); mockUid = undefined; hook.rerender();
  await act(async () => {});
  expect(mockUpdate).not.toHaveBeenCalled();
  beginInboxSession('u1'); mockUid = 'u1'; hook.rerender();
  await act(async () => {});
  expect(hook.current.recoveryDraft?.patch.body).toBe('After login');
  expect(mockUpdate).not.toHaveBeenCalled();
  hook.unmount();
});
