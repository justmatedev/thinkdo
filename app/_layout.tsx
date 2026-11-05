import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/features/auth/AuthProvider";
import {
  itemIdFromNotificationData,
  openReminderFromNotification,
} from "@/features/reminders/openReminderNavigation";
import { ThemeProvider, useTheme } from "@/lib/themeContext";
import {
  configureForegroundNotificationHandler,
} from "@/features/reminders/reminderScheduler";
import { refreshCaptureWidgets } from "@/widgets/refreshWidgets";

function RootNavigator() {
  const { colors, themeName } = useTheme();
  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    if (Platform.OS === "web") return;
    configureForegroundNotificationHandler();

    const openFromResponse = (
      response: Notifications.NotificationResponse | null
    ) => {
      if (!response) return;
      const itemId = itemIdFromNotificationData(
        response.notification.request.content.data as
          | Record<string, unknown>
          | undefined
      );
      if (itemId) void openReminderFromNotification(itemId);
    };

    void Notifications.getLastNotificationResponseAsync().then(openFromResponse);
    const sub = Notifications.addNotificationResponseReceivedListener(
      openFromResponse
    );

    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    if (Platform.OS === "android") {
      refreshCaptureWidgets();
      // Widget headless JS can lag one tick behind Metro; refresh again so
      // the home-screen bitmap picks up the latest CaptureWidget tree.
      refreshTimer = setTimeout(() => refreshCaptureWidgets(), 1200);
    }

    return () => {
      sub.remove();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
