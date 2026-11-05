import {
  reminderNotificationId,
  isReminderNotificationId,
  itemIdFromReminderNotificationId,
} from "@/features/reminders/notificationIds";

describe("itemIdFromReminderNotificationId", () => {
  it("parses base and weekday ids", () => {
    expect(itemIdFromReminderNotificationId("reminder:abc")).toBe("abc");
    expect(itemIdFromReminderNotificationId("reminder:abc:w3")).toBe("abc");
    expect(itemIdFromReminderNotificationId("other:abc")).toBeNull();
  });
});

describe("reminder notification IDs", () => {
  it("id prefix", () => {
    expect(reminderNotificationId("abc")).toBe("reminder:abc");
    expect(isReminderNotificationId("reminder:abc")).toBe(true);
    expect(isReminderNotificationId("reminder:")).toBe(true);
    expect(isReminderNotificationId("other:abc")).toBe(false);
    expect(isReminderNotificationId("remind:abc")).toBe(false);
  });
});
