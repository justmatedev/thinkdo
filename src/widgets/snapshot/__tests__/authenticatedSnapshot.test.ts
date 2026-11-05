import AsyncStorage from "@react-native-async-storage/async-storage";
import { deferred } from "@/test/renderHook";
const mockReady = jest.fn();
jest.mock("@/lib/firebase", () => ({
  auth: { authStateReady: () => mockReady(), currentUser: null },
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import { auth } from "@/lib/firebase";
import { readAuthenticatedInboxSnapshot } from "@/widgets/snapshot/authenticatedSnapshot";
import { INBOX_SNAPSHOT_KEY } from "@/widgets/snapshot/inboxSnapshot";
import { beginInboxSession, invalidateInboxSession } from "@/widgets/snapshot/session";
const mutableAuth = auth as unknown as { currentUser: { uid: string } | null };
beforeEach(async () => {
  mockReady.mockReset().mockResolvedValue(undefined);
  mutableAuth.currentUser = { uid: "a" };
  beginInboxSession("a");
  await AsyncStorage.setItem(
    INBOX_SNAPSHOT_KEY,
    JSON.stringify({
      uid: "a",
      signedIn: true,
      updatedAt: 1,
      items: [{ id: "secret", title: "Private" }],
    }),
  );
});
test("waits for persisted authentication before reading private widget data", async () => {
  const pending = deferred<void>();
  mockReady.mockReturnValue(pending.promise);
  mutableAuth.currentUser = null;
  let resolved = false;
  const read = readAuthenticatedInboxSnapshot().then((snapshot) => {
    resolved = true;
    return snapshot;
  });
  await Promise.resolve();
  expect(resolved).toBe(false);
  mutableAuth.currentUser = { uid: "a" };
  pending.resolve();
  expect((await read).items[0].id).toBe("secret");
});
test("hides a previous account snapshot", async () => {
  mutableAuth.currentUser = { uid: "b" };
  beginInboxSession("b");
  expect((await readAuthenticatedInboxSnapshot()).items).toEqual([]);
});
test("hides data during logout even before Firebase signs out", async () => {
  invalidateInboxSession();
  expect((await readAuthenticatedInboxSnapshot()).signedIn).toBe(false);
});
