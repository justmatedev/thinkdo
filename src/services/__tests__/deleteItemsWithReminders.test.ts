jest.mock("@/services/items", () => ({
  deleteItem: jest.fn(),
}));
jest.mock("@/features/reminders/reminderScheduler", () => ({
  cancelItemReminder: jest.fn(),
}));

import { deleteItemsWithReminders } from "@/services/deleteItemsWithReminders";

describe("deleteItemsWithReminders", () => {
  it("cancels reminder then deletes each id", async () => {
    const cancelItemReminder = jest.fn(async () => {});
    const deleteItem = jest.fn(async () => {});
    const result = await deleteItemsWithReminders("u1", ["a", "b"], {
      cancelItemReminder,
      deleteItem,
    });
    expect(result).toEqual({ deleted: ["a", "b"], failed: [] });
    expect(cancelItemReminder).toHaveBeenCalledWith("a");
    expect(cancelItemReminder).toHaveBeenCalledWith("b");
    expect(deleteItem).toHaveBeenCalledWith("u1", "a");
    expect(deleteItem).toHaveBeenCalledWith("u1", "b");
    expect(cancelItemReminder.mock.invocationCallOrder[0]).toBeLessThan(
      deleteItem.mock.invocationCallOrder[0]
    );
  });

  it("continues after a failure and reports partial", async () => {
    const cancelItemReminder = jest.fn(async () => {});
    const deleteItem = jest.fn(async (_u: string, id: string) => {
      if (id === "b") throw new Error("fail");
    });
    const result = await deleteItemsWithReminders("u1", ["a", "b", "c"], {
      cancelItemReminder,
      deleteItem,
    });
    expect(result).toEqual({ deleted: ["a", "c"], failed: ["b"] });
  });

  it("treats cancel failure as failed id without calling delete", async () => {
    const cancelItemReminder = jest.fn(async (id: string) => {
      if (id === "a") throw new Error("cancel");
    });
    const deleteItem = jest.fn(async () => {});
    const result = await deleteItemsWithReminders("u1", ["a", "b"], {
      cancelItemReminder,
      deleteItem,
    });
    expect(result.failed).toContain("a");
    expect(result.deleted).toContain("b");
    expect(deleteItem).not.toHaveBeenCalledWith("u1", "a");
  });
});

test('restores reminders for an item whose deletion failed', async () => {
  const restoreItemReminder = jest.fn(async () => {});
  const result = await deleteItemsWithReminders('u1', ['a'], {
    cancelItemReminder: jest.fn(async () => {}),
    deleteItem: jest.fn(async () => { throw new Error('offline'); }),
    restoreItemReminder,
  });
  expect(result.failed).toEqual(['a']);
  expect(restoreItemReminder).toHaveBeenCalledWith('u1', 'a');
});
