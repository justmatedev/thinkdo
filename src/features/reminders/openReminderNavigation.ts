import { router } from "expo-router";
import { auth } from "@/lib/firebase";
import { getItem } from "@/services/items";
import {
  consumePendingReminderItemId,
  setPendingReminderItemId,
} from "@/features/reminders/pendingReminderNavigation";

export async function openReminderFromNotification(
  itemId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    setPendingReminderItemId(itemId);
    return;
  }
  try {
    const item = await getItem(user.uid, itemId);
    if (!item) {
      router.replace("/");
      return;
    }
    router.push(`/item/${itemId}`);
  } catch {
    router.replace("/");
  }
}

export async function flushPendingReminderNavigation(): Promise<void> {
  const itemId = consumePendingReminderItemId();
  if (!itemId) return;
  await openReminderFromNotification(itemId);
}

export function itemIdFromNotificationData(
  data: Record<string, unknown> | undefined
): string | null {
  const raw = data?.itemId;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
