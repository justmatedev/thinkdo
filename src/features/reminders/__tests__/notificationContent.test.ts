import {
  truncateNotificationBody,
  notificationContent,
} from "@/features/reminders/notificationContent";

describe("notificationContent", () => {
  it("truncates at 120 with ellipsis", () => {
    const s = "x".repeat(130);
    const out = truncateNotificationBody(s);
    expect(out.length).toBe(120);
    expect(out.endsWith("…")).toBe(true);
  });
  it("builds content A fallbacks", () => {
    expect(notificationContent({ title: "  ", body: "" })).toEqual({
      title: "Lembrete",
      body: "Abrir no ThinkDo",
    });
  });
});
