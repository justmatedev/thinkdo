import type { ItemReminder, ReminderWeekday } from "@/features/reminders/types";

export type ReminderTrigger =
  | { type: "date"; date: Date }
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: ReminderWeekday; hour: number; minute: number };

export function buildReminderTriggers(
  reminder: ItemReminder
): ReminderTrigger[] {
  if (reminder.kind === "once") {
    return [{ type: "date", date: reminder.at }];
  }
  if (reminder.kind === "daily") {
    return [{ type: "daily", hour: reminder.hour, minute: reminder.minute }];
  }
  return reminder.weekdays.map((weekday) => ({
    type: "weekly" as const,
    weekday,
    hour: reminder.hour,
    minute: reminder.minute,
  }));
}

/** @deprecated Prefer buildReminderTriggers — kept for single-trigger call sites */
export function buildReminderTrigger(reminder: ItemReminder): ReminderTrigger {
  const triggers = buildReminderTriggers(reminder);
  return triggers[0];
}
