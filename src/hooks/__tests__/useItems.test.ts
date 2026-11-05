import { act, renderHook } from "@/test/renderHook";
const mockCreate = jest.fn();
let mockUser: { uid: string } | null = { uid: "u1" };
jest.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));
jest.mock("@/services/items", () => ({
  createItem: (...args: unknown[]) => mockCreate(...args),
  backfillMissingSortOrders: async () => {},
  subscribeItems: () => () => {},
}));
jest.mock("@/services/deleteItemsWithReminders", () => ({
  deleteItemsWithReminders: jest.fn(),
}));
jest.mock("@/features/reminders/reminderScheduler", () => ({
  reconcileReminders: async () => {},
}));
jest.mock("@/widgets/refreshWidgets", () => ({
  refreshInboxWidgets: async () => {},
}));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
import { useItems } from "@/hooks/useItems";
beforeEach(() => {
  mockUser = { uid: "u1" };
  mockCreate.mockReset();
});
test("confirms only a successful creation and preserves an error on failure", async () => {
  const hook = renderHook(useItems);
  await act(async () => {});
  mockCreate.mockRejectedValueOnce(new Error("denied"));
  await act(async () => {
    expect(await hook.current.create("note", "Draft")).toBe(false);
  });
  expect(hook.current.saveError).toBeTruthy();
  mockCreate.mockResolvedValueOnce("new-id");
  await act(async () => {
    expect(await hook.current.create("note", "Draft")).toBe(true);
  });
  expect(mockCreate).toHaveBeenLastCalledWith("u1", {
    type: "note",
    title: "Draft",
  });
  expect(hook.current.saveError).toBeNull();
  hook.unmount();
});
test("does not confirm a creation without a session", async () => {
  mockUser = null;
  const hook = renderHook(useItems);
  expect(await hook.current.create("note", "Draft")).toBe(false);
  expect(mockCreate).not.toHaveBeenCalled();
  hook.unmount();
});
