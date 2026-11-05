import {
  formatReminderOptionsPrimary,
  formatReminderDateValue,
  formatReminderTimeValue,
} from "@/features/reminders/reminderFormatting";

describe("formatReminderOptionsPrimary", () => {
  it("formats once with date and time", () => {
    const at = new Date(2026, 7, 9, 9, 0, 0); // Aug 9 2026 09:00 local
    const s = formatReminderOptionsPrimary({ kind: "once", at });
    expect(s).toContain("09:00");
    expect(s).toMatch(/9/);
    expect(s).toContain("·");
  });

  it("formats daily as time only", () => {
    expect(
      formatReminderOptionsPrimary({ kind: "daily", hour: 9, minute: 0 })
    ).toBe("Todos os dias · 09:00");
  });

  it("formats weekly as weekday · time", () => {
    expect(
      formatReminderOptionsPrimary({
        kind: "weekly",
        weekdays: [2],
        hour: 9,
        minute: 0,
      })
    ).toBe("Toda segunda · 09:00");
    expect(
      formatReminderOptionsPrimary({
        kind: "weekly",
        weekdays: [2, 4],
        hour: 9,
        minute: 0,
      })
    ).toBe("Toda seg, qua · 09:00");
    expect(
      formatReminderOptionsPrimary({
        kind: "weekly",
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        hour: 9,
        minute: 0,
      })
    ).toBe("Todos os dias · 09:00");
  });
});

describe("formatReminderDateValue / formatReminderTimeValue", () => {
  it("formats date in pt-BR short style and time as HH:mm", () => {
    const label = formatReminderDateValue(new Date(2026, 8, 7));
    expect(label.length).toBeGreaterThan(0);
    expect(formatReminderTimeValue(9, 5)).toBe("09:05");
  });
});
