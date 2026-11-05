export const REMINDER_DISMISS_DRAG_Y = 100;

export function shouldDismissReminderEditor(translationY: number): boolean {
  "worklet";
  return translationY > REMINDER_DISMISS_DRAG_Y;
}
