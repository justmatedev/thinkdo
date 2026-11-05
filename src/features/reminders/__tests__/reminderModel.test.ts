import {
  toggleReminderWeekday,
  parseItemReminder,
  isReminderSchedulable,
} from "@/features/reminders/reminderModel";

describe("parseItemReminder", () => {
  it("returns null for missing/invalid", () => {
    expect(parseItemReminder(undefined)).toBeNull();
    expect(parseItemReminder({ kind: "monthly" })).toBeNull();
  });
  it("parses once with Timestamp-like { toDate }", () => {
    const at = new Date("2026-08-01T18:00:00");
    expect(
      parseItemReminder({ kind: "once", at: { toDate: () => at } })
    ).toEqual({ kind: "once", at });
  });
  it("parses daily and weekly", () => {
    expect(parseItemReminder({ kind: "daily", hour: 9, minute: 0 })).toEqual({
      kind: "daily",
      hour: 9,
      minute: 0,
    });
    expect(
      parseItemReminder({ kind: "weekly", weekday: 2, hour: 9, minute: 0 })
    ).toEqual({ kind: "weekly", weekdays: [2], hour: 9, minute: 0 });
    expect(
      parseItemReminder({
        kind: "weekly",
        weekdays: [3, 2, 2],
        hour: 9,
        minute: 0,
      })
    ).toEqual({ kind: "weekly", weekdays: [2, 3], hour: 9, minute: 0 });
  });
  it("rejects out-of-range hour/weekday", () => {
    expect(parseItemReminder({ kind: "daily", hour: 24, minute: 0 })).toBeNull();
    expect(
      parseItemReminder({ kind: "weekly", weekday: 0, hour: 9, minute: 0 })
    ).toBeNull();
    expect(
      parseItemReminder({ kind: "weekly", weekdays: [], hour: 9, minute: 0 })
    ).toBeNull();
  });
});

describe("isReminderSchedulable", () => {
  it("false for past once", () => {
    expect(
      isReminderSchedulable(
        { kind: "once", at: new Date("2020-01-01") },
        new Date("2026-01-01")
      )
    ).toBe(false);
  });
  it("true for future once; false at the exact instant", () => {
    const now = new Date("2026-01-01T12:00:00");
    expect(
      isReminderSchedulable({ kind: "once", at: now }, now)
    ).toBe(false);
    expect(
      isReminderSchedulable(
        { kind: "once", at: new Date("2026-01-01T12:00:01") },
        now
      )
    ).toBe(true);
  });
});

describe("toggleReminderWeekday", () => {
  it("adds and removes while keeping at least one", () => {
    expect(toggleReminderWeekday([2], 4)).toEqual([2, 4]);
    expect(toggleReminderWeekday([2, 4], 2)).toEqual([4]);
    expect(toggleReminderWeekday([2], 2)).toEqual([2]);
  });
});
