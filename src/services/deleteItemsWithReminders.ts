import { getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";
import { deleteItem, getItem } from "@/services/items";
import { cancelItemReminder, scheduleItemReminder } from "@/features/reminders/reminderScheduler";

export type DeleteItemsWithRemindersResult = {
  deleted: string[];
  failed: string[];
};

type Deps = {
  deleteItem: (userId: string, itemId: string) => Promise<void>;
  cancelItemReminder: (itemId: string) => Promise<void>;
  restoreItemReminder?: (userId: string, itemId: string) => Promise<void>;
};

const defaultDeps: Deps = {
  deleteItem, cancelItemReminder,
  async restoreItemReminder(userId, itemId) {
    const session = getInboxSession(userId);
    if (!isInboxSessionCurrent(session)) return;
    const item = await getItem(userId, itemId);
    if (item && isInboxSessionCurrent(session))
      await scheduleItemReminder(item, () => isInboxSessionCurrent(session));
  },
};

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
      // Cancellation may have succeeded even when the document deletion failed.
      try { await deps.restoreItemReminder?.(userId, id); } catch { /* Reconciliation retries later. */ }
      failed.push(id);
    }
  }
  return { deleted, failed };
}
