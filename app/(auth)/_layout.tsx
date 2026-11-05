import { type Href, Redirect, Stack, useGlobalSearchParams } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getAuthPalette } from "@/features/auth/authPalette";
import { useTheme } from "@/lib/themeContext";
import {
  parseInboxWidgetParams,
  WIDGET_INBOX_CAPTURE_HREF,
} from "@/lib/inboxWidgetEntry";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { colors, themeName } = useTheme();
  const palette = getAuthPalette(colors, themeName);
  const entry = parseInboxWidgetParams(useGlobalSearchParams());
  const captureRequested = entry.focusCapture && entry.fromWidget;
  // This layout stays mounted across login/signup, even when their links
  // omit query parameters. Its state expires when authentication ends.
  const [pendingCapture, setPendingCapture] = useState(captureRequested);
  if (captureRequested && !pendingCapture) setPendingCapture(true);

  if (loading) return null;
  if (user) {
    return (
      <Redirect href={(pendingCapture || captureRequested ? WIDGET_INBOX_CAPTURE_HREF : "/") as Href} />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: palette.heroBackground },
      }}
    />
  );
}
