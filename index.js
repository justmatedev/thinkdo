import { Platform } from "react-native";

// Register widget handlers before expo-router boots (import is hoisted; require is not).
if (Platform.OS === "android") {
  const {
    registerWidgetTaskHandler,
    registerWidgetConfigurationScreen,
  } = require("react-native-android-widget");
  const { widgetTaskHandler } = require("./src/widgets/android/taskHandler");
  const {
    WidgetConfigScreen,
  } = require("./src/widgets/android/WidgetConfigScreen");
  registerWidgetTaskHandler(widgetTaskHandler);
  registerWidgetConfigurationScreen(WidgetConfigScreen);
}

require("expo-router/entry");
