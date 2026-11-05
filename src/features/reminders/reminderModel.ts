import type { ItemReminder, ReminderWeekday } from "@/features/reminders/types";

export const REMINDER_WEEKDAYS: ReminderWeekday[] = [1, 2, 3, 4, 5, 6, 7];

function isHourMinute(hour: unknown, minute: unknown): boolean {
  return (
    typeof hour === "number" &&
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    typeof minute === "number" &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59
  );
}

function isReminderWeekday(value: unknown): value is ReminderWeekday {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

function parseOnceAt(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  return null;
}

/** Unique, sorted ascending. Empty if none valid. */
export function normalizeReminderWeekdays(
  days: readonly ReminderWeekday[]
): ReminderWeekday[] {
  return REMINDER_WEEKDAYS.filter((day) => days.includes(day));
}

/**
 * Toggle a weekday. If it is the only selected day, returns the same list
 * (always keep at least one).
 */
export function toggleReminderWeekday(
  current: readonly ReminderWeekday[],
  weekday: ReminderWeekday
): ReminderWeekday[] {
  const normalized = normalizeReminderWeekdays(current);
  if (normalized.includes(weekday)) {
    if (normalized.length <= 1) return normalized;
    return normalized.filter((day) => day !== weekday);
  }
  return normalizeReminderWeekdays([...normalized, weekday]);
}

export function parseItemReminder(value: unknown): ItemReminder | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  if (r.kind === "once") {
    const at = parseOnceAt(r.at);
    return at ? { kind: "once", at } : null;
  }
  if (r.kind === "daily") {
    if (!isHourMinute(r.hour, r.minute)) return null;
    return { kind: "daily", hour: r.hour as number, minute: r.minute as number };
  }
  if (r.kind === "weekly") {
    if (!isHourMinute(r.hour, r.minute)) return null;
    let rawDays: ReminderWeekday[] = [];
    if (Array.isArray(r.weekdays)) {
      rawDays = r.weekdays.filter(isReminderWeekday);
    } else if (isReminderWeekday(r.weekday)) {
      rawDays = [r.weekday];
    }
    const weekdays = normalizeReminderWeekdays(rawDays);
    if (weekdays.length === 0) return null;
    return {
      kind: "weekly",
      weekdays,
      hour: r.hour as number,
      minute: r.minute as number,
    };
  }
  return null;
}

export function isReminderSchedulable(
  reminder: ItemReminder,
  now: Date = new Date()
): boolean {
  if (reminder.kind === "once") return reminder.at.getTime() > now.getTime();
  return true;
}

export function reminderToFirestore(
  reminder: ItemReminder | null
): ItemReminder | null {
  return reminder;
}
