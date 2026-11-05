import { act, deferred, renderHook } from "@/test/renderHook";
import { useInboxDeletion } from "@/hooks/useInboxDeletion";
import type { Item } from "@/types/item";

function setup(online = true) {
  const input = {
    online,
    items: [{ id: "a", type: "note", title: "Comprar café" }] as Item[],
    selectedIds: ["a", "b"],
    remove: jest.fn().mockResolvedValue(undefined),
    removeMany: jest.fn().mockResolvedValue({ deleted: ["a"], failed: ["b"] }),
    clearSelection: jest.fn(),
    removeSelectionIds: jest.fn(),
  };
  return { input, hook: renderHook(() => useInboxDeletion(input)) };
}

test("keeps failed items selected after a partial bulk deletion", async () => {
  const { input, hook } = setup();
  act(() => hook.current.requestDeleteSelected());
  expect(hook.current.confirmTitle).toContain("2");
  await act(async () => hook.current.confirmDelete());
  expect(input.removeMany).toHaveBeenCalledWith(["a", "b"]);
  expect(input.removeSelectionIds).toHaveBeenCalledWith(["a"]);
  expect(input.clearSelection).not.toHaveBeenCalled();
  expect(hook.current.confirmOpen).toBe(false);
  hook.unmount();
});

test("clears the selection only after every selected item was deleted", async () => {
  const { input, hook } = setup();
  input.removeMany.mockResolvedValue({ deleted: ["a", "b"], failed: [] });
  act(() => hook.current.requestDeleteSelected());
  await act(async () => hook.current.confirmDelete());
  expect(input.clearSelection).toHaveBeenCalledTimes(1);
  expect(input.removeSelectionIds).not.toHaveBeenCalled();
  hook.unmount();
});

test("blocks duplicate confirmation and closing while deletion is pending, and allows retry after failure", async () => {
  const { input, hook } = setup();
  const pending = deferred<void>();
  input.remove.mockReturnValueOnce(pending.promise);
  act(() => hook.current.requestDelete("a"));
  let result!: Promise<void>;
  act(() => {
    result = hook.current.confirmDelete();
  });
  expect(hook.current.deleting).toBe(true);
  act(() => hook.current.closeConfirm());
  await act(async () => hook.current.confirmDelete());
  expect(hook.current.confirmOpen).toBe(true);
  expect(input.remove).toHaveBeenCalledTimes(1);
  await act(async () => {
    pending.reject(new Error("offline"));
    await result;
  });
  expect(hook.current.confirmOpen).toBe(true);
  expect(hook.current.deleting).toBe(false);
  await act(async () => hook.current.confirmDelete());
  expect(hook.current.confirmOpen).toBe(false);
  expect(input.remove).toHaveBeenCalledTimes(2);
  hook.unmount();
});

test("does not open deletion while offline or with no selected items", () => {
  const { input, hook } = setup(false);
  act(() => {
    hook.current.requestDelete("a");
    hook.current.requestDeleteSelected();
  });
  expect(hook.current.confirmOpen).toBe(false);
  input.online = true;
  input.selectedIds = [];
  hook.rerender();
  act(() => hook.current.requestDeleteSelected());
  expect(hook.current.confirmOpen).toBe(false);
  expect(input.remove).not.toHaveBeenCalled();
  expect(input.removeMany).not.toHaveBeenCalled();
  hook.unmount();
});
