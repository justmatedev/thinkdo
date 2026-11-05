import type { ReminderWeekday } from "@/features/reminders/types";
import { REMINDER_WEEKDAYS } from "@/features/reminders/reminderModel";

export function reminderNotificationId(itemId: string): string {
  return `reminder:${itemId}`;
}

export function reminderWeekdayNotificationId(
  itemId: string,
  weekday: ReminderWeekday
): string {
  return `reminder:${itemId}:w${weekday}`;
}

/** Base id + one id per weekday — used when cancelling an item’s schedules. */
export function reminderNotificationIdsForItem(itemId: string): string[] {
  return [
    reminderNotificationId(itemId),
    ...REMINDER_WEEKDAYS.map((weekday) =>
      reminderWeekdayNotificationId(itemId, weekday)
    ),
  ];
}

export function isReminderNotificationId(id: string): boolean {
  return id.startsWith("reminder:");
}

/** Extract item id from `reminder:{id}` or `reminder:{id}:w{1-7}`. */
export function itemIdFromReminderNotificationId(id: string): string | null {
  if (!isReminderNotificationId(id)) return null;
  const rest = id.slice("reminder:".length);
  if (!rest) return null;
  const weekdaySuffix = rest.match(/^(.*):w[1-7]$/);
  return weekdaySuffix ? weekdaySuffix[1] : rest;
}
