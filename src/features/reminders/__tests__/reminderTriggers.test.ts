import {
  buildReminderTriggers,
  buildReminderTrigger,
} from "@/features/reminders/reminderTriggers";

describe("buildReminderTriggers", () => {
  it("maps kinds including multi weekly", () => {
    const at = new Date("2026-08-01T18:00:00");
    expect(buildReminderTrigger({ kind: "once", at })).toEqual({
      type: "date",
      date: at,
    });
    expect(buildReminderTrigger({ kind: "daily", hour: 9, minute: 30 })).toEqual({
      type: "daily",
      hour: 9,
      minute: 30,
    });
    expect(
      buildReminderTriggers({
        kind: "weekly",
        weekdays: [2, 4],
        hour: 9,
        minute: 0,
      })
    ).toEqual([
      { type: "weekly", weekday: 2, hour: 9, minute: 0 },
      { type: "weekly", weekday: 4, hour: 9, minute: 0 },
    ]);
  });
});
