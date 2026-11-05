import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactElement } from "react";
import { deferred } from "@/test/renderHook";
const mockTheme = jest.fn();
jest.mock("@/widgets/inbox/InboxWidget", () => ({ InboxWidget: () => null }));
jest.mock("@/widgets/capture/widgetThemePreference", () => ({
  loadWidgetThemePreference: () => mockTheme(),
}));
jest.mock("@/widgets/inbox/inboxWidgetFilter", () => ({
  loadInboxWidgetFilter: async () => "all",
}));
jest.mock("@/lib/firebase", () => ({
  auth: { authStateReady: async () => {}, currentUser: { uid: "a" } },
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import { auth } from "@/lib/firebase";
import { beginInboxSession } from "@/widgets/snapshot/session";
import { readAuthenticatedInboxSnapshot } from "@/widgets/snapshot/authenticatedSnapshot";
import { clearInboxSnapshot, INBOX_SNAPSHOT_KEY } from "@/widgets/snapshot";
import { resolveInboxWidgetRepresentation } from "@/widgets/inbox/inboxWidgetRender";
test("a render waiting on preferences cannot publish private rows after logout", async () => {
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
  const theme = deferred<string>();
  mockTheme.mockReturnValue(theme.promise);
  const render = resolveInboxWidgetRepresentation(1, 300, 180);
  await readAuthenticatedInboxSnapshot();
  await clearInboxSnapshot();
  (auth as unknown as { currentUser: null }).currentUser = null;
  theme.resolve("light");
  const result = (await render) as ReactElement<{
    snapshot: { items: unknown[]; signedIn: boolean };
  }>;
  expect(result.props.snapshot.items).toEqual([]);
  expect(result.props.snapshot.signedIn).toBe(false);
});
