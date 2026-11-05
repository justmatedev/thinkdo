import { clearInboxSnapshot } from "@/widgets/snapshot";
import { refreshInboxWidgets } from "@/widgets/refreshWidgets";
import { cancelAllReminders } from "@/features/reminders/reminderScheduler";
import { signOutUser } from "@/features/auth/authService";

export async function signOutSession(): Promise<void> {
  // clear invalidates producers synchronously, then drains earlier cache writes.
  await clearInboxSnapshot();
  await cancelAllReminders();
  await refreshInboxWidgets();
  await signOutUser();
}
