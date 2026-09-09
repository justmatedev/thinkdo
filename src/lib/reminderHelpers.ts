import type { ItemReminder, ReminderWeekday } from "../types/item";

export type ReminderTrigger =
  | { type: "date"; date: Date }
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: ReminderWeekday; hour: number; minute: number };

const WEEKDAY_PT: Record<ReminderWeekday, string> = {
  1: "dom",
  2: "seg",
  3: "ter",
  4: "qua",
  5: "qui",
  6: "sex",
  7: "sáb",
};

const ALL_WEEKDAYS: ReminderWeekday[] = [1, 2, 3, 4, 5, 6, 7];

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
  return ALL_WEEKDAYS.filter((day) => days.includes(day));
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

export function truncateNotificationBody(
  body: string,
  max: number = 120
): string {
  if (body.length <= max) return body;
  if (max <= 1) return "…".slice(0, max);
  return body.slice(0, max - 1) + "…";
}

export function notificationContent(item: {
  title: string;
  body: string;
}): { title: string; body: string } {
  const title = item.title.trim() || "Lembrete";
  const trimmedBody = item.body.trim();
  const body = trimmedBody
    ? truncateNotificationBody(trimmedBody)
    : "Abrir no ThinkDo";
  return { title, body };
}

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
    ...ALL_WEEKDAYS.map((weekday) =>
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

export function repetitionLabel(kind: ItemReminder["kind"]): string {
  if (kind === "once") return "Nunca";
  if (kind === "daily") return "Diário";
  return "Semanal";
}

export function weekdayLabelPt(weekday: ReminderWeekday): string {
  return WEEKDAY_PT[weekday];
}

const WEEKDAY_FULL_PT: Record<ReminderWeekday, string> = {
  1: "domingo",
  2: "segunda",
  3: "terça",
  4: "quarta",
  5: "quinta",
  6: "sexta",
  7: "sábado",
};

export function weekdayFullLabelPt(weekday: ReminderWeekday): string {
  return WEEKDAY_FULL_PT[weekday];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function timeHm(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function formatReminderOptionsPrimary(reminder: ItemReminder): string {
  if (reminder.kind === "once") {
    const datePart = reminder.at.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return `${datePart} · ${timeHm(reminder.at.getHours(), reminder.at.getMinutes())}`;
  }
  if (reminder.kind === "daily") {
    return `Todos os dias · ${timeHm(reminder.hour, reminder.minute)}`;
  }
  const time = timeHm(reminder.hour, reminder.minute);
  if (reminder.weekdays.length === 7) {
    return `Todos os dias · ${time}`;
  }
  if (reminder.weekdays.length === 1) {
    return `Toda ${weekdayFullLabelPt(reminder.weekdays[0])} · ${time}`;
  }
  return `Toda ${reminder.weekdays.map(weekdayLabelPt).join(", ")} · ${time}`;
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

export function formatReminderDateValue(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatReminderTimeValue(hour: number, minute: number): string {
  return timeHm(hour, minute);
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

export function reminderToFirestore(
  reminder: ItemReminder | null
): ItemReminder | null {
  return reminder;
}
