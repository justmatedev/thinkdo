import { deleteItem } from "@/services/items";
import { cancelItemReminder } from "@/features/reminders/reminderScheduler";

export type DeleteItemsWithRemindersResult = {
  deleted: string[];
  failed: string[];
};

type Deps = {
  deleteItem: (userId: string, itemId: string) => Promise<void>;
  cancelItemReminder: (itemId: string) => Promise<void>;
};

const defaultDeps: Deps = { deleteItem, cancelItemReminder };

export async function deleteItemsWithReminders(
  userId: string,
  itemIds: string[],
  deps: Deps = defaultDeps
): Promise<DeleteItemsWithRemindersResult> {
  const deleted: string[] = [];
  const failed: string[] = [];
  for (const id of itemIds) {
    try {
      await deps.cancelItemReminder(id);
      await deps.deleteItem(userId, id);
      deleted.push(id);
    } catch {
      failed.push(id);
    }
  }
  return { deleted, failed };
}
