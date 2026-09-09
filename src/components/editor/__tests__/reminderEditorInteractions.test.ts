import { shouldDismissReminderEditor } from "../reminderEditorInteractions";

describe("shouldDismissReminderEditor", () => {
  it("dismisses only after a downward drag passes the threshold", () => {
    expect(shouldDismissReminderEditor(100)).toBe(false);
    expect(shouldDismissReminderEditor(101)).toBe(true);
    expect(shouldDismissReminderEditor(-140)).toBe(false);
  });
});
