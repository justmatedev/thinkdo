import type { ItemReminder, ReminderWeekday } from "@/features/reminders/types";

const WEEKDAY_PT: Record<ReminderWeekday, string> = {
  1: "dom",
  2: "seg",
  3: "ter",
  4: "qua",
  5: "qui",
  6: "sex",
  7: "sáb",
};

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
