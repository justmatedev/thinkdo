import AsyncStorage from "@react-native-async-storage/async-storage";
import { createElement, useEffect } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
let mockAuthChanged: (user: unknown) => void;
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, callback: typeof mockAuthChanged) => {
    mockAuthChanged = callback;
    return () => {};
  },
}));
jest.mock("@/lib/firebase", () => ({
  auth: { currentUser: null, authStateReady: async () => {} },
}));
jest.mock("@/features/auth/authService", () => ({}));
jest.mock("@/features/auth/signOutSession", () => ({ signOutSession: jest.fn() }));
const mockPublished: string[][] = [];
jest.mock("@/widgets/refreshWidgets", () => ({
  refreshInboxWidgets: async () => {
    const { readAuthenticatedInboxSnapshot } = require("@/widgets/snapshot/authenticatedSnapshot");
    const snapshot = await readAuthenticatedInboxSnapshot();
    mockPublished.push(snapshot.items.map((row: { id: string }) => row.id));
  },
}));

import { auth } from "@/lib/firebase";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { INBOX_SNAPSHOT_KEY, readInboxSnapshot } from "@/widgets/snapshot";
import { beginInboxSession, getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";

const mutableAuth = auth as unknown as { currentUser: { uid: string; providerData: [] } | null };
let tree: ReactTestRenderer;
let current: ReturnType<typeof useAuth>;
function Consumer() {
  const value = useAuth();
  useEffect(() => { current = value; }, [value]);
  return null;
}
async function emitUser(uid: string | null) {
  await act(async () => {
    mutableAuth.currentUser = uid ? { uid, providerData: [] } : null;
    mockAuthChanged(mutableAuth.currentUser);
  });
}
beforeEach(async () => {
  mockPublished.length = 0;
  beginInboxSession("a");
  await AsyncStorage.setItem(INBOX_SNAPSHOT_KEY, JSON.stringify({
    uid: "a", signedIn: true, updatedAt: 1,
    items: [{ id: "saved-task", type: "task", title: "Saved", done: false }],
  }));
  await act(async () => {
    tree = create(createElement(AuthProvider, null, createElement(Consumer)));
  });
});
afterEach(() => act(() => tree.unmount()));

test("restoring the same account preserves and publishes rows without a mounted inbox", async () => {
  await emitUser("a");
  expect(current.user?.uid).toBe("a");
  expect(current.loading).toBe(false);
  expect((await readInboxSnapshot()).items.map(row => row.id)).toEqual(["saved-task"]);
  expect(mockPublished).toEqual([["saved-task"]]);
});

test("switching accounts clears old rows and invalidates previous writers", async () => {
  const old = getInboxSession("a");
  await emitUser("b");
  expect(current.user?.uid).toBe("b");
  expect((await readInboxSnapshot()).items).toEqual([]);
  expect(mockPublished).toEqual([[]]);
  expect(isInboxSessionCurrent(old)).toBe(false);
  expect(isInboxSessionCurrent(getInboxSession("b"))).toBe(true);
});

test("signed-out authentication clears cached private rows", async () => {
  await emitUser(null);
  expect(current.user).toBeNull();
  expect((await readInboxSnapshot()).signedIn).toBe(false);
  expect(mockPublished).toEqual([[]]);
});
