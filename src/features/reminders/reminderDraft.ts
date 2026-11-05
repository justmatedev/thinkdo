import type { ItemReminder, ReminderWeekday } from "@/features/reminders/types";
import { isReminderSchedulable } from "@/features/reminders/reminderModel";

export function defaultReminderDraft(now: Date = new Date()): ItemReminder {
  const at = new Date(now);
  at.setSeconds(0, 0);
  at.setMinutes(0);
  at.setHours(at.getHours() + 1);
  return { kind: "once", at };
}

/** JS Date#getDay() 0–6 (Sun–Sat) → Expo weekday 1–7 */
export function jsWeekdayToReminderWeekday(jsDay: number): ReminderWeekday {
  return ((jsDay % 7) + 1) as ReminderWeekday;
}

export function reminderWeekdayFromDate(date: Date): ReminderWeekday {
  return jsWeekdayToReminderWeekday(date.getDay());
}

/** Next calendar date whose Expo weekday matches (today if already that day). */
export function nextDateForWeekday(
  weekday: ReminderWeekday,
  now: Date = new Date()
): Date {
  const targetJs = weekday - 1; // 0–6
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const delta = (targetJs - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export function withReminderDate(
  reminder: ItemReminder,
  date: Date
): ItemReminder {
  const hour =
    reminder.kind === "once" ? reminder.at.getHours() : reminder.hour;
  const minute =
    reminder.kind === "once" ? reminder.at.getMinutes() : reminder.minute;
  const at = new Date(date);
  at.setHours(hour, minute, 0, 0);
  return { kind: "once", at };
}

export function withReminderTime(
  reminder: ItemReminder,
  hour: number,
  minute: number
): ItemReminder {
  if (reminder.kind === "once") {
    const at = new Date(reminder.at);
    at.setHours(hour, minute, 0, 0);
    return { kind: "once", at };
  }
  return { ...reminder, hour, minute };
}

export function tryCommitReminder(
  next: ItemReminder,
  now: Date = new Date()
): ItemReminder | null {
  if (!isReminderSchedulable(next, now)) return null;
  return next;
}

function combineDateAndTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function applyReminderRepetition(
  current: ItemReminder,
  kind: ItemReminder["kind"],
  now: Date = new Date()
): ItemReminder {
  const hour =
    current.kind === "once" ? current.at.getHours() : current.hour;
  const minute =
    current.kind === "once" ? current.at.getMinutes() : current.minute;

  if (kind === "daily") {
    return { kind: "daily", hour, minute };
  }
  if (kind === "weekly") {
    const base =
      current.kind === "once"
        ? current.at
        : current.kind === "weekly"
          ? nextDateForWeekday(current.weekdays[0], now)
          : nextDateForWeekday(reminderWeekdayFromDate(now), now);
    return {
      kind: "weekly",
      weekdays: [reminderWeekdayFromDate(base)],
      hour,
      minute,
    };
  }
  const draft = defaultReminderDraft(now);
  if (draft.kind !== "once") return draft;
  const at = combineDateAndTime(draft.at, hour, minute);
  if (at.getTime() <= now.getTime()) {
    at.setDate(at.getDate() + 1);
  }
  return { kind: "once", at };
}
