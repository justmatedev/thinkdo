/** Expo/iOS weekday: 1 = Sunday … 7 = Saturday */
export type ReminderWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ItemReminder =
  | { kind: "once"; at: Date }
  | { kind: "daily"; hour: number; minute: number }
  | {
      kind: "weekly";
      /** Unique Expo weekdays 1–7, sorted ascending, length ≥ 1 */
      weekdays: ReminderWeekday[];
      hour: number;
      minute: number;
    };
