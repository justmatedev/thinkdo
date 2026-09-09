import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  buildReminderTriggers,
  isReminderNotificationId,
  isReminderSchedulable,
  itemIdFromReminderNotificationId,
  notificationContent,
  reminderNotificationId,
  reminderNotificationIdsForItem,
  reminderWeekdayNotificationId,
  type ReminderTrigger,
} from "../lib/reminderHelpers";
import type { Item } from "../types/item";

const CHANNEL_ID = "reminders";

function toExpoTrigger(
  shape: ReminderTrigger
): Notifications.NotificationTriggerInput {
  if (shape.type === "date") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: shape.date,
      channelId: CHANNEL_ID,
    };
  }
  if (shape.type === "daily") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: shape.hour,
      minute: shape.minute,
      channelId: CHANNEL_ID,
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: shape.weekday,
    hour: shape.hour,
    minute: shape.minute,
    channelId: CHANNEL_ID,
  };
}

function identifierForTrigger(
  itemId: string,
  trigger: ReminderTrigger
): string {
  if (trigger.type === "weekly") {
    return reminderWeekdayNotificationId(itemId, trigger.weekday);
  }
  return reminderNotificationId(itemId);
}

export function configureForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Lembretes",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getReminderPermissionGranted(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

export async function requestReminderPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return requested.status === "granted";
}

export async function cancelItemReminder(itemId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all(
    reminderNotificationIdsForItem(itemId).map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // No scheduled notification for this id — ignore
      }
    })
  );
}

export async function scheduleItemReminder(item: Item): Promise<void> {
  if (Platform.OS === "web") return;
  if (!item.reminder || !isReminderSchedulable(item.reminder)) {
    await cancelItemReminder(item.id);
    return;
  }
  const granted = await getReminderPermissionGranted();
  if (!granted) {
    await cancelItemReminder(item.id);
    return;
  }
  await ensureReminderChannel();
  await cancelItemReminder(item.id);
  const content = notificationContent(item);
  const triggers = buildReminderTriggers(item.reminder);
  await Promise.all(
    triggers.map((trigger) =>
      Notifications.scheduleNotificationAsync({
        identifier: identifierForTrigger(item.id, trigger),
        content: {
          title: content.title,
          body: content.body,
          data: { itemId: item.id },
          sound: true,
        },
        trigger: toExpoTrigger(trigger),
      })
    )
  );
}

export async function reconcileReminders(items: Item[]): Promise<void> {
  if (Platform.OS === "web") return;
  const living = new Set(items.map((i) => i.id));
  for (const item of items) {
    await scheduleItemReminder(item);
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const id = n.identifier;
    if (!isReminderNotificationId(id)) continue;
    const itemId = itemIdFromReminderNotificationId(id);
    if (!itemId || !living.has(itemId)) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => isReminderNotificationId(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}
