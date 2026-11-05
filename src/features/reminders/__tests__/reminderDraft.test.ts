import {
  defaultReminderDraft,
  nextDateForWeekday,
  withReminderDate,
  withReminderTime,
  tryCommitReminder,
  applyReminderRepetition,
} from "@/features/reminders/reminderDraft";

describe("defaultReminderDraft", () => {
  it("uses next full hour; rolls to tomorrow if needed", () => {
    const now = new Date("2026-07-29T14:20:00");
    const draft = defaultReminderDraft(now);
    expect(draft.kind).toBe("once");
    if (draft.kind === "once") {
      expect(draft.at.getHours()).toBe(15);
      expect(draft.at.getMinutes()).toBe(0);
      expect(draft.at.getDate()).toBe(29);
    }
  });
});

describe("nextDateForWeekday", () => {
  it("returns upcoming date for Expo weekday 2 (Monday)", () => {
    // 2026-07-29 is Wednesday (js 3). Next Monday = Aug 3.
    const d = nextDateForWeekday(2, new Date("2026-07-29T10:00:00"));
    expect(d.getDay()).toBe(1);
  });
});

describe("withReminderDate", () => {
  it("sets once date and keeps hour/minute", () => {
    const at = new Date(2026, 8, 7, 14, 30);
    const next = withReminderDate({ kind: "once", at }, new Date(2026, 8, 10));
    expect(next).toEqual({
      kind: "once",
      at: new Date(2026, 8, 10, 14, 30),
    });
  });

  it("promotes daily to once using selected date and existing time", () => {
    const next = withReminderDate(
      { kind: "daily", hour: 9, minute: 15 },
      new Date(2026, 8, 12)
    );
    expect(next).toEqual({
      kind: "once",
      at: new Date(2026, 8, 12, 9, 15),
    });
  });
});

describe("withReminderTime", () => {
  it("updates once time in place", () => {
    const at = new Date(2026, 8, 7, 14, 30);
    expect(withReminderTime({ kind: "once", at }, 16, 45)).toEqual({
      kind: "once",
      at: new Date(2026, 8, 7, 16, 45),
    });
  });

  it("updates daily and weekly hour/minute", () => {
    expect(
      withReminderTime({ kind: "daily", hour: 9, minute: 0 }, 8, 5)
    ).toEqual({ kind: "daily", hour: 8, minute: 5 });
    expect(
      withReminderTime(
        { kind: "weekly", weekdays: [2], hour: 9, minute: 0 },
        18,
        0
      )
    ).toEqual({ kind: "weekly", weekdays: [2], hour: 18, minute: 0 });
  });
});

describe("tryCommitReminder", () => {
  it("returns null for past once", () => {
    const now = new Date(2026, 8, 7, 12, 0);
    expect(
      tryCommitReminder({ kind: "once", at: new Date(2026, 8, 7, 11, 0) }, now)
    ).toBeNull();
  });

  it("returns the reminder when schedulable", () => {
    const next = { kind: "daily" as const, hour: 9, minute: 0 };
    expect(tryCommitReminder(next)).toEqual(next);
  });
});

describe("applyReminderRepetition", () => {
  it("daily keeps hour/minute from once", () => {
    const at = new Date(2026, 7, 9, 14, 30);
    expect(
      applyReminderRepetition({ kind: "once", at }, "daily")
    ).toEqual({ kind: "daily", hour: 14, minute: 30 });
  });

  it("weekly takes weekday from once date", () => {
    const at = new Date(2026, 7, 9, 9, 0); // Sunday
    expect(
      applyReminderRepetition({ kind: "once", at }, "weekly")
    ).toEqual({ kind: "weekly", weekdays: [1], hour: 9, minute: 0 });
  });

  it("rolls a past daily time to tomorrow when switching to once", () => {
    const now = new Date(2026, 7, 9, 14, 30);
    const result = applyReminderRepetition(
      { kind: "daily", hour: 9, minute: 15 },
      "once",
      now
    );

    expect(result).toEqual({
      kind: "once",
      at: new Date(2026, 7, 10, 9, 15),
    });
  });

  it("keeps a future daily time today when switching to once", () => {
    const now = new Date(2026, 7, 9, 14, 30);
    const result = applyReminderRepetition(
      { kind: "daily", hour: 18, minute: 45 },
      "once",
      now
    );

    expect(result).toEqual({
      kind: "once",
      at: new Date(2026, 7, 9, 18, 45),
    });
  });
});
