import AsyncStorage from "@react-native-async-storage/async-storage";
const mockSignOut = jest.fn();
const mockCancel = jest.fn();
const mockRefresh = jest.fn();
jest.mock("@/features/auth/authService", () => ({ signOutUser: () => mockSignOut() }));
jest.mock("@/features/reminders/reminderScheduler", () => ({
  cancelAllReminders: () => mockCancel(),
}));
jest.mock("@/widgets/refreshWidgets", () => ({
  refreshInboxWidgets: () => mockRefresh(),
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import { signOutSession } from "@/features/auth/signOutSession";
import {
  INBOX_SNAPSHOT_KEY,
  buildInboxSnapshot,
  readInboxSnapshot,
  writeInboxSnapshot,
} from "@/widgets/snapshot";
import {
  beginInboxSession,
  getInboxSession,
} from "@/widgets/snapshot/session";
beforeEach(async () => {
  jest.clearAllMocks();
  beginInboxSession("a");
  await writeInboxSnapshot(
    buildInboxSnapshot({ uid: "a", signedIn: true, items: [] }),
  );
});
test("clears and refreshes the widget without any mounted inbox before signing out", async () => {
  const oldSession = getInboxSession("a");
  mockRefresh.mockImplementation(async () => {
    expect((await readInboxSnapshot()).signedIn).toBe(false);
  });
  await signOutSession();
  expect(mockCancel).toHaveBeenCalledTimes(1);
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  await writeInboxSnapshot(
    buildInboxSnapshot({ uid: "a", signedIn: true, items: [] }),
    oldSession,
  );
  expect(await AsyncStorage.getItem(INBOX_SNAPSHOT_KEY)).toBeNull();
});
test("does not confirm signout when mandatory cache cleanup fails and can retry", async () => {
  const spy = jest
    .spyOn(AsyncStorage, "removeItem")
    .mockRejectedValueOnce(new Error("storage failed"));
  await expect(signOutSession()).rejects.toThrow("storage failed");
  expect(mockSignOut).not.toHaveBeenCalled();
  await expect(signOutSession()).resolves.toBeUndefined();
  expect(mockSignOut).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
