import { type Href, Redirect, Stack, useGlobalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { flushPendingReminderNavigation } from "@/features/reminders/openReminderNavigation";
import { useTheme } from "@/lib/themeContext";
import { parseInboxWidgetParams } from "@/lib/inboxWidgetEntry";

export default function AppLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const entry = parseInboxWidgetParams(useGlobalSearchParams());
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    void flushPendingReminderNavigation();
  }, [uid]);

  if (loading) return null;
  if (!user) {
    const href = entry.focusCapture && entry.fromWidget
      ? "/login?focus=capture&source=widget"
      : "/login";
    return <Redirect href={href as Href} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
