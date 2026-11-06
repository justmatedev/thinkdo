import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  buildReminderTriggers,
  type ReminderTrigger,
} from "@/features/reminders/reminderTriggers";
import {
  isReminderNotificationId,
  itemIdFromReminderNotificationId,
  reminderNotificationId,
  reminderNotificationIdsForItem,
  reminderWeekdayNotificationId,
} from "@/features/reminders/notificationIds";
import { isReminderSchedulable } from "@/features/reminders/reminderModel";
import { notificationContent } from "@/features/reminders/notificationContent";
import type { Item } from "@/types/item";

const CHANNEL_ID = "reminders";

function toExpoTrigger(
  shape: ReminderTrigger,
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
  trigger: ReminderTrigger,
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

async function cancelScheduledItemReminder(itemId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all(
    reminderNotificationIdsForItem(itemId).map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // No scheduled notification for this id — ignore
      }
    }),
  );
}

let reminderGeneration = 0;
let reconciliationVersion = 0;
const activeSchedules = new Set<Promise<void>>();
const itemQueues = new Map<string, Promise<void>>();
const itemVersions = new Map<string, number>();
let nextItemVersion = 0;

function enqueueItem(itemId: string, operation: (isLatest: () => boolean) => Promise<void>): Promise<void> {
  const version = ++nextItemVersion;
  itemVersions.set(itemId, version);
  const result = (itemQueues.get(itemId) ?? Promise.resolve()).catch(() => {}).then(() =>
    operation(() => itemVersions.get(itemId) === version));
  itemQueues.set(itemId, result);
  activeSchedules.add(result);
  void result.finally(() => {
    activeSchedules.delete(result);
    if (itemQueues.get(itemId) === result) {
      itemQueues.delete(itemId);
    }
  }).catch(() => {});
  return result;
}

export function cancelItemReminder(itemId: string): Promise<void> {
  return enqueueItem(itemId, () => cancelScheduledItemReminder(itemId));
}

export function scheduleItemReminder(
  item: Item,
  isSessionCurrent: () => boolean = () => true,
): Promise<void> {
  const generation = reminderGeneration;
  return enqueueItem(item.id, (isLatest) => schedule(
    item,
    () => generation === reminderGeneration && isLatest() && isSessionCurrent(),
  ));
}

async function schedule(item: Item, isCurrent: () => boolean): Promise<void> {
  if (Platform.OS === "web" || !isCurrent()) return;
  if ((item.type === "task" && item.done) || !item.reminder || !isReminderSchedulable(item.reminder)) {
    await cancelScheduledItemReminder(item.id);
    return;
  }
  const granted = await getReminderPermissionGranted();
  if (!isCurrent()) return;
  if (!granted) {
    await cancelScheduledItemReminder(item.id);
    return;
  }
  await ensureReminderChannel();
  if (!isCurrent()) return;
  await cancelScheduledItemReminder(item.id);
  if (!isCurrent()) return;
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
      }),
    ),
  );
  // A native scheduling call cannot be aborted; clear its result before the next queued operation.
  if (!isCurrent()) await cancelScheduledItemReminder(item.id);
}

export async function reconcileReminders(items: Item[]): Promise<void> {
  if (Platform.OS === "web") return;
  const generation = reminderGeneration;
  const version = ++reconciliationVersion;
  const isCurrent = () => generation === reminderGeneration && version === reconciliationVersion;
  const cleanupVersions = new Map(itemVersions);
  const living = new Set(items.map((i) => i.id));
  // Reserve all requests before yielding, so a later completion/deletion can
  // invalidate any item in this batch even while another item is awaiting native IO.
  await Promise.all(items.map((item) => scheduleItemReminder(item, isCurrent)));
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (!isCurrent()) return;
  for (const n of scheduled) {
    if (!isCurrent()) return;
    const id = n.identifier;
    if (!isReminderNotificationId(id)) continue;
    const itemId = itemIdFromReminderNotificationId(id);
    if (itemId && !living.has(itemId) && itemVersions.get(itemId) === cleanupVersions.get(itemId)) {
      // Use the same item queue and skip schedules issued after this snapshot began.
      await cancelItemReminder(itemId);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  ++reminderGeneration;
  await Promise.allSettled([...activeSchedules]);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => isReminderNotificationId(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
